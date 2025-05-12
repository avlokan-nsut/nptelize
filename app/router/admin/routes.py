from fastapi import APIRouter, Depends

from app.config.db import get_db
from app.models import UserRole, User
from app.oauth2 import get_current_admin
from app.router.admin.schemas import StudentCreate, TeacherCreate, AdminCreate
from app.schemas import TokenData
from app.services.utils.hashing import generate_password_hash

from sqlalchemy.orm import Session

from typing import List


router = APIRouter('/admin')

@router.post('/create_students')
def create_students(
    students: List[StudentCreate], 
    current_admin: TokenData = Depends(get_current_admin), 
    db: Session = Depends(get_db)
):
    db_students = []
    
    for student in students: 
        student_password_hash = generate_password_hash(student.password)
        db_students.append(
            User(
                name=student.name,
                email=student.email,
                password_hash=student_password_hash,
                role=UserRole.student,
                roll_number=student.roll_number
            )
        )
    try:
        db.add_all(db_students)
        db.commit()
    except Exception as e:
        db.rollback()
        print(e)

@router.post('/create_teachers')
def create_teachers(
    teachers: List[TeacherCreate], 
    current_admin: TokenData = Depends(get_current_admin), 
    db: Session = Depends(get_db)
):
    db_teachers = []
    
    for teacher in teachers: 
        teacher_password_hash = generate_password_hash(teacher.password)
        db_teachers.append(
            User(
                name=teacher.name,
                email=teacher.email,
                password_hash=teacher_password_hash,
                role=UserRole.teacher,
                employee_id=teacher.employee_id
            )
        )
    try:
        db.add_all(db_teachers)
        db.commit()
    except Exception as e:
        db.rollback()
        print(e)


@router.post('/create_admins')
def create_admins(
    admins: List[AdminCreate], 
    current_admin: TokenData = Depends(get_current_admin), 
    db: Session = Depends(get_db)
):
    db_admins = []
    
    for admin in admins: 
        admin_password_hash = generate_password_hash(admin.password)
        db_admins.append(
            User(
                name=admin.name,
                email=admin.email,
                password_hash=admin_password_hash,
                role=UserRole.admin,
                employee_id=admin.employee_id
            )
        )
    try:
        db.add_all(db_admins)
        db.commit()
    except Exception as e:
        db.rollback()
        print(e)

