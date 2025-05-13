from fastapi import APIRouter, Depends

from app.config.db import get_db
from app.models import UserRole, User, Subject
from app.oauth2 import get_current_admin
from app.router.admin.schemas import StudentCreate, TeacherCreate, AdminCreate, CreateUserResponse, SubjectCreate, CreateSubjectResponse
from app.schemas import TokenData
from app.services.utils.hashing import generate_password_hash

from sqlalchemy.orm import Session

from typing import List


router = APIRouter(prefix='/admin')

@router.post('/create/students', response_model=CreateUserResponse)
def create_students(
    students: List[StudentCreate], 
    current_admin: TokenData = Depends(get_current_admin), 
    db: Session = Depends(get_db)
):
    results = []
    db_students = []
    
    # TODO: Find a faster approach
    # First attempt batch processing
    try:
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
        
        db.add_all(db_students)
        db.commit()
        
        # All succeeded
        return {
            'results': [
                {"email": student.email, "success": True, "message": "Student created"} 
                for student in students
            ]
        }
                
    except Exception as batch_error:
        db.rollback()
        print(f"Batch processing failed: {batch_error}")
        
        # If batch fails, try individual processing to identify problematic records
        for student in students:
            try:
                student_password_hash = generate_password_hash(student.password)
                db_student = User(
                    name=student.name,
                    email=student.email,
                    password_hash=student_password_hash,
                    role=UserRole.student,
                    roll_number=student.roll_number
                )
                
                db.add(db_student)
                db.commit()
                results.append({
                    "email": student.email,
                    "success": True,
                    "message": "Student created successfully"
                })
            except Exception as e:
                db.rollback()
                results.append({
                    "email": student.email,
                    "success": False,
                    "message": str(e)
                })
        
        return {
            'results': results
        }

@router.post('/create/teachers', response_model=CreateUserResponse)
def create_teachers(
    teachers: List[TeacherCreate], 
    current_admin: TokenData = Depends(get_current_admin), 
    db: Session = Depends(get_db)
):
    results = []
    
    for teacher in teachers: 
        try:
            teacher_password_hash = generate_password_hash(teacher.password)
            db_teacher = User(
                name=teacher.name,
                email=teacher.email,
                password_hash=teacher_password_hash,
                role=UserRole.teacher,
                employee_id=teacher.employee_id
            )
            db.add(db_teacher)
            db.commit()
            results.append({
                "email": teacher.email,
                "success": True,
                "message": "Teacher created successfully"
            })
        except Exception as e:
            db.rollback()
            print(e)
            results.append({
                "email": teacher.email,
                "success": False,
                "message": "Failed to create teacher" 
            })

    return {
        'results': results
    }


@router.post('/create/admins', response_model=CreateUserResponse)
def create_admins(
    admins: List[AdminCreate], 
    current_admin: TokenData = Depends(get_current_admin), 
    db: Session = Depends(get_db)
):
    results = []
    for admin in admins: 
        try:
            admin_password_hash = generate_password_hash(admin.password)
            db_admin = User(
                name=admin.name,
                email=admin.email,
                password_hash=admin_password_hash,
                role=UserRole.admin,
                employee_id=admin.employee_id
            )
            db.add(db_admin)
            db.commit()
            results.append({
                "email": admin.email,
                "success": True,
                "message": "Admin created successfully"
            })
        except Exception as e:
            db.rollback()
            print(e)
            results.append({
                "email": admin.email,
                "success": False,
                "message": "Failed to create admin" 
            })

    return {
        'results': results
    }

@router.post('/create/subjects', response_model=CreateSubjectResponse)
def create_subjects(
    subjects: List[SubjectCreate],
    current_admin: TokenData = Depends(get_current_admin),
    db: Session = Depends(get_db)
):
    results = []
    for subject in subjects:
        try:
            db_subject = Subject(
                name=subject.name,
                subject_code=subject.subject_code,
                teacher_id=subject.teacher_id
            )
            db.add(db_subject)
            db.commit()
            results.append({
                "subject_code": subject.subject_code,
                "success": True,
                "message": "Subject created successfully"
            })
        except Exception as e:
            db.rollback()
            print(e)
            results.append({
                "subject_code": subject.subject_code,
                "success": False,
                "message": "Failed to create subject"
            })
    return {
        'results': results
    }