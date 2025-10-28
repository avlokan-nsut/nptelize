from fastapi import APIRouter, Depends, HTTPException, status, Response, Request, Query
from fastapi.responses import FileResponse
from sqlalchemy.orm import Session

from app.config import config
from app.database.core import get_db
from app.database.models import User, UserRole
from .schemas import LoginRequest, LoginResponse, UserInfoResponse
from app.oauth2 import create_access_token, get_current_user_role_agnostic
from app.schemas import TokenData
from app.services.utils.hashing import verify_password_hash

import os
from typing import cast, Optional, List, Dict


ENV=config['ENV']
CERTIFICATES_FOLDER_PATH = config['CERTIFICATES_FOLDER_PATH']

DEVELOPMENT = ENV == 'DEVELOPMENT'
TESTING = ENV == 'TESTING'


router = APIRouter(prefix='/user')

@router.post("/login", response_model=LoginResponse)
def login(
    role: UserRole, credentials: LoginRequest, response: Response, db: Session = Depends(get_db),
):
    user = db.query(User).filter(User.email == credentials.email).first()
    if (
        not user 
        or not verify_password_hash(credentials.password, cast(str, user.password_hash)) 
        or user.role != role
    ):
        raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail="Invalid credentials")
    
    user_role_mappings = user.user_role_mappings
    service_role_dict: Dict[str, List[str]] = {}

    if user_role_mappings:
        for mapping in user_role_mappings:
            role_name = mapping.role_assigned.name
            module_name = mapping.role_assigned.module_name

            assert role_name is not None
            assert module_name is not None

            if module_name not in service_role_dict:
                service_role_dict[module_name] = []
            
            service_role_dict[module_name].append(role_name)

    
    access_token = create_access_token(
        data={
            'email': user.email,
            'role': user.role.value,
            'user_id': user.id,
            'name': user.name,
            'service_role_dict': service_role_dict,
        }
    )

    response.set_cookie(
        key="access_token",
        value=access_token,
        httponly=True,                          # not accessible by client side javascript
        secure=False if TESTING else True,
        samesite='none' if DEVELOPMENT else 'strict',
        path="/",
    )

    return {
        'message': "Login successful", 
        'email': user.email,
        'role': user.role.value,
        'user_id': user.id,
        'name': user.name,
        'service_role_dict': service_role_dict,
    }
    
@router.get('/me', response_model=UserInfoResponse)
def get_user_info(
    db: Session = Depends(get_db),
    current_user: TokenData = Depends(get_current_user_role_agnostic),
):
    db_user = db.query(User).filter(User.id == current_user.user_id).first()
    if not db_user:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="User not found")

    user_role_mappings = db_user.user_role_mappings
    service_role_dict: Dict[str, List[str]] = {}

    if user_role_mappings:
        for mapping in user_role_mappings:
            role_name = mapping.role_assigned.name
            module_name = mapping.role_assigned.module_name

            assert role_name is not None
            assert module_name is not None

            if module_name not in service_role_dict:
                service_role_dict[module_name] = []
            
            service_role_dict[module_name].append(role_name)

    return {
        'user_id': db_user.id,
        'name': db_user.name,
        'email': db_user.email,
        'role': db_user.role,
        'service_role_dict': service_role_dict
    }

@router.post("/logout")
def logout(request: Request, response: Response):
    if request.cookies.get("access_token"):
        response.delete_cookie(
            "access_token",
            path='/',
            httponly=True,
            secure=False if TESTING else True,
            samesite='none' if DEVELOPMENT else 'strict',
        )
        return {"message": "Logout successful"}
    else:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="No active session found")


@router.get('/certificate/file/{request_id}.pdf')
def get_certificate_file_static(
    request_id: str,
    download: Optional[bool] = Query(False),
    db: Session = Depends(get_db),
):
    file_path = f"{CERTIFICATES_FOLDER_PATH}/{request_id}.pdf"

    # check if file exists
    if not os.path.exists(file_path):
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="File not found"
        )

    content_disposition = "attachment" if download else "inline"
    
    return FileResponse(
        path=file_path,
        media_type="application/pdf",
        filename=f"{request_id}.pdf",
        headers={
            "Content-Disposition": f"{content_disposition}; filename={request_id}.pdf"
        }
    )