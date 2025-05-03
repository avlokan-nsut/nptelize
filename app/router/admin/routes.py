from typing import cast

from fastapi import APIRouter, Depends, HTTPException, status, Response
from sqlalchemy.orm import Session

from app.config.db import get_db
from app.models import User, UserRole
from app.oauth2 import create_access_token
from app.router.admin.schemas import AdminLoginRequest
from app.services.utils.hashing import verify_password_hash

router = APIRouter(prefix="/admin")


@router.post("/login")
async def login(
        credentials: AdminLoginRequest, response: Response, db: Session = Depends(get_db),
):
    user = db.query(User).filter(User.email == credentials.email).first()
    if (
            not user
            or not verify_password_hash(credentials.password, cast(str, user.password_hash))
            or user.role != UserRole.admin
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
        httponly=True,
        secure=True,
        samesite="None",
    )

    return {'message': "Login successful", 'user_id': user.id}
