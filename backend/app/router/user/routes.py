from fastapi import APIRouter, Depends, HTTPException, status, Response, Request, Query
from fastapi.responses import FileResponse
from sqlalchemy.orm import Session

from app.config import config
from app.config.db import get_db
from app.models import User, UserRole
from app.router.user.schemas import LoginRequest, LoginResponse, UserInfoResponse, ChangePasswordRequest
from app.oauth2 import create_access_token, get_current_user_role_agnostic
from app.schemas import TokenData, GenericResponse
from app.services.utils.hashing import verify_password_hash, generate_password_hash

import os
from typing import cast, Optional


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
    
    access_token = create_access_token(
        data={
            'email': user.email,
            'role': user.role.value,
            'user_id': user.id,
            'name': user.name,
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
            'user_id': user.id,
            'name': user.name
        }
    
@router.get('/me', response_model=UserInfoResponse)
def get_user_info(
    db: Session = Depends(get_db),
    current_user: TokenData = Depends(get_current_user_role_agnostic),
):
    db_user = db.query(User).filter(User.id == current_user.user_id).first()
    if not db_user:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="User not found")

    return {
        'user_id': db_user.id,
        'name': db_user.name,
        'email': db_user.email,
        'role': db_user.role,
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

@router.put("/change-password", response_model=GenericResponse)
def change_password(
    password_data: ChangePasswordRequest,
    response: Response,
    db: Session = Depends(get_db),
    current_user: TokenData = Depends(get_current_user_role_agnostic),
):
    """
    Change user password after verifying current password
    """
    # Get the user from database
    db_user = db.query(User).filter(User.id == current_user.user_id).first()
    if not db_user:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND, 
            detail="User not found"
        )
    
    # Verify current password
    if not verify_password_hash(password_data.current_password, cast(str, db_user.password_hash)):
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST, 
            detail="Current password is incorrect"
        )
    
    # Check if new password is different from current password
    if verify_password_hash(password_data.new_password, cast(str, db_user.password_hash)):
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST, 
            detail="New password must be different from current password"
        )
    
    try:
        # Generate hash for new password
        new_password_hash = generate_password_hash(password_data.new_password)
        
        # Update password in database
        db_user.password_hash = new_password_hash
        db.commit()
        
        # Logout user by clearing the access token cookie
        response.delete_cookie(
            "access_token",
            path='/',
            httponly=True,
            secure=False if TESTING else True,
            samesite='none' if DEVELOPMENT else 'strict',
        )
        
        return {"message": "Password changed successfully. You have been logged out for security."}
        
    except Exception as e:
        db.rollback()
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Failed to change password"
        )