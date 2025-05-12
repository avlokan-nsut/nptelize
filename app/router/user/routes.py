from fastapi import APIRouter, Depends, HTTPException, status, Response
from sqlalchemy.orm import Session
from app.config.db import get_db
from app.models import User, UserRole
from app.router.user.schemas import LoginRequest
from app.services.utils.hashing import verify_password_hash
from app.oauth2 import create_access_token
from typing import cast


router = APIRouter(prefix='/user')

@router.post("/login")
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
            'role': user.role,
            'user_id': user.id,
            'name': user.name,
        }
    )

    response.set_cookie(
        key="access_token",
        value=access_token,
        httponly=True,
        secure=True,
        samesite="None",
    )

    return {'message': "Login successful", 'user_id': user.id}
