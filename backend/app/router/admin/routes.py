from fastapi import APIRouter, Depends, HTTPException, status

from app.config.db import get_db
from app.models import UserRole, User, Subject, StudentSubject
from app.oauth2 import get_current_admin
from app.router.admin.schemas import StudentCreate, TeacherCreate, AdminCreate, CreateUserResponse, SubjectCreate, CreateSubjectResponse, AddStudentToSubjectSchema
from app.schemas import TokenData, GenericResponse
from app.services.utils.hashing import generate_password_hash

import multiprocessing
from sqlalchemy.orm import Session

from typing import List


router = APIRouter(prefix='/admin')

@router.get('/get/students')
def get_students(
    db: Session = Depends(get_db),
    current_admin: TokenData = Depends(get_current_admin)
):
    students = db.query(User).filter(User.role == UserRole.student).all()
    return {
        'students': [
            {
                'id': student.id,
                'name': student.name,
                'email': student.email,
                'roll_number': student.roll_number
            }
            for student in students
        ]
    }

@router.get('/get/teachers')
def get_teachers(
    db: Session = Depends(get_db),
    current_admin: TokenData = Depends(get_current_admin)
):
    teachers = db.query(User).filter(User.role == UserRole.teacher).all()
    return {
        'teachers': [
            {
                'id': teacher.id,
                'name': teacher.name,
                'email': teacher.email,
                'employee_id': teacher.employee_id
            }
            for teacher in teachers
        ]
    }

@router.get('/get/subjects')
def get_subjects(
    db: Session = Depends(get_db),
    current_admin: TokenData = Depends(get_current_admin)
):
    subjects = db.query(Subject).all()
    return {
        'subjects': [
            {
                'id': subject.id,
                'name': subject.name,
                'subject_code': subject.subject_code,
                'nptel_course_code': subject.nptel_course_code,
                'teacher_id': subject.teacher_id
            }
            for subject in subjects
        ]
    }

@router.get('/get/subject-students/{student_id}')
def get_students_in_a_subject(
    student_id: str,
    db: Session = Depends(get_db),
    current_admin: TokenData = Depends(get_current_admin)
): 
    students = db.query(
        User
    ).join(
        StudentSubject,
        User.id == StudentSubject.student_id
    ).filter(
        StudentSubject.subject_id == student_id
    ).all()

    return {
        'students': [
            {
                'id': student.id,
                'name': student.name,
                'email': student.email,
                'roll_number': student.roll_number
            }
            for student in students
        ]
    }

@router.get('/get/student-subjects/{student_id}')
def get_subjects_of_a_student(
    student_id: str,
    db: Session = Depends(get_db),
    current_admin: TokenData = Depends(get_current_admin)
):
    subjects = db.query(Subject).join(
        StudentSubject,
        Subject.id == StudentSubject.subject_id
    ).filter(StudentSubject.student_id == student_id).all()
    return {
        'subjects': [
            {
                'id': subject.id,
                'name': subject.name,
                'subject_code': subject.subject_code,
                'teacher_id': subject.teacher_id
            }
            for subject in subjects
        ]
    }

@router.post('/create/students', response_model=CreateUserResponse)
def create_students(
    students: List[StudentCreate], 
    current_admin: TokenData = Depends(get_current_admin), 
    db: Session = Depends(get_db)
):
    results = []
    db_students = []
    
    # TODO: Find a faster approach
    # Generate password hashes in parallel
    with multiprocessing.Pool() as pool:
        student_password_hashes = pool.map(generate_password_hash, [student.password for student in students]) 
    try:
        for i, student in enumerate(students):
            student_password_hash = student_password_hashes[i]
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
        for i, student in enumerate(students):
            try:
                student_password_hash = student_password_hashes[i]
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

            except Exception: 
                db.rollback()
                results.append({
                    "email": student.email,
                    "success": False,
                    "message": "Server error",
                })
        
        return {
            'results': results
        }

@router.post('/create/teachers', response_model=GenericResponse)
def create_coordinator(
    teacher_data: TeacherCreate, 
    current_admin: TokenData = Depends(get_current_admin), 
    db: Session = Depends(get_db)
):
    # check if any teacher already exists
    existing_teacher = db.query(User).filter(User.role == UserRole.teacher).first()
    if existing_teacher:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="A coordinator already exists")

    try:
        teacher_password_hash = generate_password_hash(teacher_data.password)
        db_teacher = User(
            name=teacher_data.name,
            email=teacher_data.email,
            password_hash=teacher_password_hash,
            role=UserRole.teacher,
            employee_id=teacher_data.employee_id
        )
        db.add(db_teacher)
        db.commit()

        return {
            "message": "Teacher created successfully"
        }
    except Exception as e:
        db.rollback()
        raise e

@router.post('/create/admins', response_model=GenericResponse)
def create_admins(
    admin_data: AdminCreate, 
    current_admin: TokenData = Depends(get_current_admin), 
    db: Session = Depends(get_db)
):
    # check if any admin already exists 
    existing_admin = db.query(User).filter(User.role == UserRole.admin).first()
    if existing_admin:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="An admin already exists")

    try:
        admin_password_hash = generate_password_hash(admin_data.password)
        db_admin = User(
            name=admin_data.name,
            email=admin_data.email,
            password_hash=admin_password_hash,
            role=UserRole.admin,
            employee_id=admin_data.employee_id
        )
        db.add(db_admin)
        db.commit()

        return {
            "message": "Admin created successfully"
        }
    except Exception as e:
        db.rollback()
        raise e

@router.post('/create/subjects', response_model=CreateSubjectResponse)
def create_subjects(
    subjects: List[SubjectCreate],
    current_admin: TokenData = Depends(get_current_admin),
    db: Session = Depends(get_db)
):
    results = []
    coordinator = db.query(User).filter(User.role == UserRole.teacher).first()
    if not coordinator:
        return {
            'results': [
                {
                    "subject_code": subject.subject_code,
                    "nptel_course_code": subject.nptel_course_code,
                    "success": False,
                    "message": "No coordinator exists"
                } 
                for subject in subjects
            ]
        }

    for subject in subjects:
        try:
            db_subject = Subject(
                name=subject.name,
                subject_code=subject.subject_code,
                teacher_id=coordinator.id,
                nptel_course_code=subject.nptel_course_code,
            )

            db.add(db_subject)
            db.commit()
            results.append({
                "subject_code": subject.subject_code,
                "nptel_course_code": subject.nptel_course_code,
                "success": True,
                "message": "Subject created successfully"
            })
        except Exception as e:
            db.rollback()
            print(e)
            results.append({
                "subject_code": subject.subject_code,
                "nptel_course_code": subject.nptel_course_code,
                "success": False,
                "message": "Failed to create subject"
            })
    return {
        'results': results
    }


@router.post('/add/students')
def add_students_to_subject(
    students: List[AddStudentToSubjectSchema],
    db: Session = Depends(get_db),
    current_teacher: TokenData = Depends(get_current_admin)
):
    add_status = []
    for student in students:
        subject_condition = Subject.subject_code == student.course_code
        # check if student exists
        try:
            db_student = db.query(User).filter(User.email == student.email, User.role == UserRole.student).first()
            if not db_student:
                add_status.append({
                    'email': student.email,
                    'success': False,
                    'message': 'Student not found',
                    'course_code': student.course_code
                })
                continue 

            # check if subject exists
            db_subject = db.query(Subject).filter(subject_condition).first()
            if not db_subject:
                add_status.append({
                    'email': student.email,
                    'success': False,
                    'message': 'Subject not found',
                    'course_code': student.course_code,
                })
                continue

            # check if student is already enrolled in the subject
            student_subject = db.query(StudentSubject).filter(
                StudentSubject.student_id == db_student.id,
                StudentSubject.subject_id == db_subject.id
            ).first()
            if student_subject:
                add_status.append({
                    'email': student.email,
                    'success': False,
                    'message': 'Student already enrolled in the subject',
                    'course_code': student.course_code,
                })
                continue

            # add student to subject
            student_subject = StudentSubject(
                student_id=db_student.id,
                subject_id=db_subject.id
            )


            db.add(student_subject)
            db.commit()
            db.refresh(student_subject)

            add_status.append({
                'email': student.email,
                'success': True,
                'message': 'Student added to subject',
                'course_code': student.course_code,
            })
        except Exception as e:
            print(e)
            db.rollback()
            add_status.append({
                'email': student.email,
                'success': False,
                'message': 'Unknown error while adding student to subject',
                'course_code': student.course_code,
            })
            continue

    return {
        'results': add_status
    }

@router.delete('/delete/student-subject')
def delete_student_from_subject(
    student_id: str,
    subject_id: str,
    db: Session = Depends(get_db),
    current_admin: TokenData = Depends(get_current_admin)
):
    try:
        student_subject = db.query(StudentSubject).filter(
            StudentSubject.student_id == student_id,
            StudentSubject.subject_id == subject_id
        ).first()

        if not student_subject:
            raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Student not enrolled in this subject")

        db.delete(student_subject)
        db.commit()

        return {
            'message': 'Student removed from subject successfully'
        }

    except Exception as e:
        db.rollback()
        raise e