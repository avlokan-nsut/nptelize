from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from typing import List

from app.config.db import get_db
from app.oauth2 import get_current_teacher
from app.schemas import TokenData
from app.router.teacher.schemas import AddStudentToSubjectSchema, SubjectResponse, EnrolledStudentResponse
from app.models import User, UserRole, Subject, StudentSubject, Request


router = APIRouter(prefix="/teacher")

@router.get('/subjects', response_model=SubjectResponse)
def get_alloted_subjects(
    db: Session = Depends(get_db),
    current_teacher: TokenData = Depends(get_current_teacher)
):
    subjects = db.query(Subject).filter(Subject.teacher_id == current_teacher.user_id).all()
    return {
        'subjects': subjects
    }


@router.get('/requests/{subject_id}')
def get_student_requests(subject_id: str, db: Session = Depends(get_db), current_teacher: TokenData = Depends(get_current_teacher)):
    # requests for a particular subject
    requests = db.query(Request).filter(
        Request.subject_id == subject_id,
        Request.teacher_id == current_teacher.user_id
    ).all()
    return {
        'requests': [
            {
               'student': {
                    'id': request.student.id,
                    'name': request.student.name,
                    'email': request.student.email,
                    'roll_number': request.student.roll_number,
                },
                'subject': {
                    'id': request.subject.id,
                    'name': request.subject.name,
                    'subject_code': request.subject.subject_code,
                    'teacher_id': request.subject.teacher_id,
                },
                'status': request.status,
                'created_at': request.created_at,
            }
            for request in requests
        ]
    }

@router.get('/students/{subject_id}', response_model=EnrolledStudentResponse)
def get_students_in_subject(
    subject_id: str,
    db: Session = Depends(get_db),
    current_teacher: TokenData = Depends(get_current_teacher)
):
    subject = db.query(Subject).filter(Subject.id == subject_id).first()

    if not subject:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Subject not found")

    if subject.teacher_id != current_teacher.user_id:
        raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail="You are not authorized to view this subject")
    
    enrolled_students = db.query(User).join(
        StudentSubject,
        StudentSubject.student_id == User.id
    ).filter(
        StudentSubject.subject_id == subject_id
    ).all()

    return {
        'enrolled_students': enrolled_students
    }

@router.post('/add/students')
def add_students_to_subject(
    students: List[AddStudentToSubjectSchema],
    db: Session = Depends(get_db),
    current_teacher: TokenData = Depends(get_current_teacher)
):
    add_status = []
    for student in students:
        # check if student exists
        try:
            db_student = db.query(User).filter(User.email == student.email, User.role == UserRole.student).first()
            if not db_student:
                add_status.append({
                    'email': student.email,
                    'success': False,
                    'message': 'Student not found'
                })
                continue 

            # check if subject exists
            subject = db.query(Subject).filter(Subject.id == student.subject_id).first()
            if not subject:
                add_status.append({
                    'email': student.email,
                    'success': False,
                    'message': 'Subject not found'
                })
                continue

            # check if student is already enrolled in the subject
            student_subject = db.query(StudentSubject).filter(
                StudentSubject.student_id == db_student.id,
                StudentSubject.subject_id == subject.id
            ).first()
            if student_subject:
                add_status.append({
                    'email': student.email,
                    'success': False,
                    'message': 'Student already enrolled in the subject'
                })
                continue

            # add student to subject
            student_subject = StudentSubject(
                student_id=db_student.id,
                subject_id=subject.id
            )

            certificate_request = Request(
                subject_id=student.subject_id,
                student_id=db_student.id,
                teacher_id=current_teacher.user_id,
                due_date=student.due_date
            )

            db.add(student_subject)
            db.add(certificate_request)
            db.commit()
            db.refresh(student_subject)

            add_status.append({
                'email': student.email,
                'success': True,
                'message': 'Student added to subject'
            })
        except Exception as e:
            print(e)
            db.rollback()
            add_status.append({
                'email': student.email,
                'success': False,
                'message': 'Unknown error while adding student to subject'
            })
            continue

    return {
        'status': add_status
    }