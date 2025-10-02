from fastapi import APIRouter, Depends, HTTPException, status, Query

from app.database.core import get_db
from app.database.models import UserRole, User, Subject, StudentSubjectEnrollment, TeacherSubjectAllotment
from app.oauth2 import get_current_admin
from .schemas import (
    StudentCreate, 
    TeacherCreate, 
    AdminCreate, 
    CreateUserResponse, 
    CreateTeacherResponse,
    SubjectCreate, 
    CreateSubjectResponse, 
    AddStudentToSubjectSchema, 
    AddTeacherToSubjectSchema

)
from app.schemas import TokenData, GenericResponse
from app.services.utils.hashing import generate_password_hash
from app.services.log_service import setup_logger

import multiprocessing

from sqlalchemy.orm import Session
from sqlalchemy import and_

from typing import List

logger = setup_logger(__name__)

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
            }
            for subject in subjects
        ]
    }

@router.get('/get/session-subjects')
def get_session_subjects(
    year: int = Query(),
    sem: int = Query(),
    db: Session = Depends(get_db),
    current_admin: TokenData = Depends(get_current_admin)
):
    is_sem_odd = bool(sem & 1)

    allotments = db.query(TeacherSubjectAllotment).filter(
        TeacherSubjectAllotment.year == year,
        TeacherSubjectAllotment.is_sem_odd == is_sem_odd
    ).all()

    return {
        'subjects': [
            {
                'id': allotment.subject.id,
                'name': allotment.subject.name,
                'subject_code': allotment.subject.subject_code,
                'nptel_course_id': allotment.subject.nptel_course_code,
                'teacher_id': allotment.teacher_id
            }
            for allotment in allotments
        ]
    }

@router.get('/get/subject-students/{subject_id}')
def get_students_in_a_subject(
    subject_id: str,
    year: int = Query(),
    sem: int = Query(),
    db: Session = Depends(get_db),
    current_admin: TokenData = Depends(get_current_admin)
): 
    is_sem_odd = bool(sem & 1)

    student_enrollments = db.query(StudentSubjectEnrollment).filter(
        StudentSubjectEnrollment.teacher_subject_allotment.has(
            and_(
                TeacherSubjectAllotment.subject_id == subject_id,
                TeacherSubjectAllotment.year == year,
                TeacherSubjectAllotment.is_sem_odd == is_sem_odd
            )
        )
    ).all()

    return {
        'students': [
            {
                'id': enrollment.student.id,
                'name': enrollment.student.name,
                'email': enrollment.student.email,
                'roll_number': enrollment.student.roll_number
            }
            for enrollment in student_enrollments
        ]
    }

@router.get('/get/student-subjects/{student_id}')
def get_subjects_of_a_student(
    student_id: str,
    year: int = Query(),
    sem: int = Query(),
    db: Session = Depends(get_db),
    current_admin: TokenData = Depends(get_current_admin)
):
    is_sem_odd = bool(sem & 1)

    enrollments = db.query(StudentSubjectEnrollment).filter(
        StudentSubjectEnrollment.student_id == student_id,
        StudentSubjectEnrollment.teacher_subject_allotment.has(
            and_(
                TeacherSubjectAllotment.year == year,
                TeacherSubjectAllotment.is_sem_odd == is_sem_odd
            )
        )
    ).all()

    return {
        'subjects': [
            {
                'id': enrollment.teacher_subject_allotment.subject.id,
                'name': enrollment.teacher_subject_allotment.subject.name,
                'subject_code': enrollment.teacher_subject_allotment.subject.subject_code,
                'teacher_id': enrollment.teacher_subject_allotment.teacher_id
            }
            for enrollment in enrollments
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
        logger.error(f"Batch processing failed: {batch_error}")
        
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

@router.post('/create/teachers', response_model=CreateTeacherResponse)
def create_coordinator(
    teacher_data_list: List[TeacherCreate],  
    current_admin: TokenData = Depends(get_current_admin), 
    db: Session = Depends(get_db)
):
    results = []
    
    for teacher_data in teacher_data_list:
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
            results.append({
                "employee_id": teacher_data.employee_id,
                "email": teacher_data.email,
                "success": True,
                "message": "Teacher created successfully"
            })
        except Exception as e:
            db.rollback()
            logger.error(f"Teacher creation error: {e}")
            results.append({
                "employee_id": teacher_data.employee_id,
                "email": teacher_data.email,
                "success": False,
                "message": "Failed to create teacher"
            })
    
    return {
        'results': results
    }


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

    for subject in subjects:
        try:
            db_subject = Subject(
                name=subject.name,
                subject_code=subject.subject_code,
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
            logger.error(f"Subject creation error: {e}")
            results.append({
                "subject_code": subject.subject_code,
                "nptel_course_code": subject.nptel_course_code,
                "success": False,
                "message": "Failed to create subject"
            })
    return {
        'results': results
    }

@router.post('/allot/teacher-subject')
def allot_teacher_to_subject(
    teachers_data: List[AddTeacherToSubjectSchema],
    year: int = Query(),
    sem: int = Query(),
    db: Session = Depends(get_db),
):
    is_sem_odd = bool(sem & 1)
    allotment_status = []

    for teacher in teachers_data:
        try:
            # Check if teacher exists
            db_teacher = db.query(User).filter(
                User.email == teacher.email, 
                User.role == UserRole.teacher
            ).first()
            if not db_teacher:
                allotment_status.append({
                    'email': teacher.email,
                    'success': False,
                    'message': 'Teacher not found',
                    'course_code': teacher.course_code
                })
                continue

            # Check if subject exists
            db_subject = db.query(Subject).filter(Subject.subject_code == teacher.course_code).first()
            if not db_subject:
                allotment_status.append({
                    'email': teacher.email,
                    'success': False,
                    'message': 'Subject not found',
                    'course_code': teacher.course_code,
                })
                continue
                
            db_allotment = db.query(TeacherSubjectAllotment).filter(
                TeacherSubjectAllotment.teacher_id == db_teacher.id,
                TeacherSubjectAllotment.subject_id == db_subject.id,
                TeacherSubjectAllotment.year == year,
                TeacherSubjectAllotment.is_sem_odd == is_sem_odd
            ).first()


            if db_allotment:
                allotment_status.append({
                    'email': teacher.email,
                    'success': False,
                    'message': 'Teacher already allotted to this subject',
                    'course_code': teacher.course_code
                })
                continue

            # Create the allotment
            allotment = TeacherSubjectAllotment(
                teacher_id=db_teacher.id,
                subject_id=db_subject.id,
                year=year,
                is_sem_odd=is_sem_odd
            )

            db.add(allotment)
            db.commit()

            allotment_status.append({
                'email': teacher.email,
                'success': True,
                'message': 'Teacher allotted to subject successfully',
                'course_code': teacher.course_code
            })
        except Exception as e:
            logger.error(f"Error allotting teacher to subject: {e}")
            db.rollback()
            allotment_status.append({
                'email': teacher.email,
                'success': False,
                'message': 'Unknown error while allotting teacher to subject',
                'course_code': teacher.course_code,
            })

    return {
        'results': allotment_status
    }

@router.put('/allot/teacher-subject')
def change_teacher_for_subject(
    teachers_data: List[AddTeacherToSubjectSchema],
    year: int = Query(),
    sem: int = Query(),
    db: Session = Depends(get_db),
):
    is_sem_odd = bool(sem & 1)
    change_status = []

    for teacher in teachers_data:
        try:
            # Check if teacher exists
            db_teacher = db.query(User).filter(
                User.email == teacher.email,
                User.role == UserRole.teacher
            ).first()
            if not db_teacher:
                change_status.append({
                    'email': teacher.email,
                    'success': False,
                    'message': 'Teacher not found',
                    'course_code': teacher.course_code
                })
                continue

            # Check if subject exists
            db_subject = db.query(Subject).filter(Subject.subject_code == teacher.course_code).first()
            if not db_subject:
                change_status.append({
                    'email': teacher.email,
                    'success': False,
                    'message': 'Subject not found',
                    'course_code': teacher.course_code,
                })
                continue

            # Find and remove any existing allotment for this subject, year, sem
            db_old_allotment = db.query(TeacherSubjectAllotment).filter(
                TeacherSubjectAllotment.subject_id == db_subject.id,
                TeacherSubjectAllotment.year == year,
                TeacherSubjectAllotment.is_sem_odd == is_sem_odd
            ).first()

            if db_old_allotment:
                db.delete(db_old_allotment)
                db.commit()

            # Allot the new teacher
            new_allotment = TeacherSubjectAllotment(
                teacher_id=db_teacher.id,
                subject_id=db_subject.id,
                year=year,
                is_sem_odd=is_sem_odd
            )
            db.add(new_allotment)
            db.commit()

            change_status.append({
                'email': teacher.email,
                'success': True,
                'message': 'Teacher changed and allotted to subject successfully',
                'course_code': teacher.course_code
            })
        except Exception as e:
            logger.error(f"Error changing teacher allotment: {e}")
            db.rollback()
            change_status.append({
                'email': teacher.email,
                'success': False,
                'message': 'Unknown error while changing teacher for subject',
                'course_code': teacher.course_code,
            })

    return {'results': change_status}


@router.post('/enroll/students')
def enroll_students_to_subject(
    students: List[AddStudentToSubjectSchema],
    year: int = Query(),
    sem: int = Query(),
    db: Session = Depends(get_db),
    current_admin: TokenData = Depends(get_current_admin)
):
    is_sem_odd = bool(sem & 1)

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
            db_subject_allotment = db.query(TeacherSubjectAllotment).filter(
                TeacherSubjectAllotment.subject.has(
                    subject_condition
                ),
                TeacherSubjectAllotment.year == year,
                TeacherSubjectAllotment.is_sem_odd == is_sem_odd
            ).first()

            if not db_subject_allotment:
                add_status.append({
                    'email': student.email,
                    'success': False,
                    'message': 'Subject not found',
                    'course_code': student.course_code,
                })
                continue

            # check if student is already enrolled in the subject
            student_subject = db.query(StudentSubjectEnrollment).filter(
                StudentSubjectEnrollment.student_id == db_student.id,
                StudentSubjectEnrollment.teacher_subject_allotment_id == db_subject_allotment.id
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
            student_subject = StudentSubjectEnrollment(
                student_id=db_student.id,
                teacher_subject_allotment_id=db_subject_allotment.id
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
            logger.error(f"Error adding student to subject: {e}")
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
    year: int = Query(),
    sem: int = Query(),
    db: Session = Depends(get_db),
    current_admin: TokenData = Depends(get_current_admin)
):
    is_sem_odd = bool(sem & 1)
    
    try:
        student_subject = db.query(StudentSubjectEnrollment).filter(
            StudentSubjectEnrollment.student_id == student_id,
            StudentSubjectEnrollment.teacher_subject_allotment.has(
                and_(
                    TeacherSubjectAllotment.subject_id == subject_id,
                    TeacherSubjectAllotment.year == year,
                    TeacherSubjectAllotment.is_sem_odd == is_sem_odd
                )
            )
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