from fastapi import APIRouter, Depends, Response, HTTPException, status
from sqlalchemy.orm import Session

from app.config.db import get_db
from app.models import User, Subject, UserRole, StudentSubject, RequestStatus
from app.oauth2 import create_access_token, get_current_user
from app.router.teacher.schemas import TeacherLoginRequest
from app.services.utils.hashing import verify_password_hash
from app.schemas import TokenData

from typing import cast

router = APIRouter(prefix="/teacher")

@router.post("/login")
def login_teacher(credentials: TeacherLoginRequest, response: Response, db: Session = Depends(get_db)):
    user = db.query(User).filter(User.email == credentials.email).first()
    if (
        not user 
        or not verify_password_hash(credentials.password, cast(str,user.password_hash)) 
        or user.role != UserRole.teacher
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

@router.get("/alloted-subjects")
def get_alloted_subjects(db: Session = Depends(get_db), current_user: TokenData = Depends(get_current_user)):
    pass


@router.get("/request/{subject_code}")
def get_student_requests(subject_code: str, db: Session = Depends(get_db), current_user: dict = Depends(get_current_user)):
    pass