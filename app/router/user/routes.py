from fastapi import APIRouter, Depends, HTTPException, status, Response, Request
from sqlalchemy.orm import Session

from app.config.db import get_db
from app.models import User, UserRole
from app.router.user.schemas import LoginRequest, LoginResponse, UserInfoResponse
from app.oauth2 import create_access_token, get_current_user_role_agnostic
from app.schemas import TokenData
from app.services.utils.hashing import verify_password_hash

from typing import cast
import os


router = APIRouter(prefix='/user')

ENV=os.environ.get('ENV', 'PRODUCTION')
PRODUCTION = ENV == 'PRODUCTION'

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
        secure=True if PRODUCTION else False,   # only sent over https
        samesite="strict" if PRODUCTION else False,     
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
            secure=True if PRODUCTION else False,
            samesite="strict" if PRODUCTION else 'none',
        )
        return {"message": "Logout successful"}
    else:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="No active session found")
