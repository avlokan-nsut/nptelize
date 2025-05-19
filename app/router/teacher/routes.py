from fastapi import APIRouter, Depends, HTTPException, status, Body
from sqlalchemy.orm import Session
from typing import List

from app.config.db import get_db
from app.oauth2 import get_current_teacher
from app.schemas import TokenData
from app.router.teacher.schemas import SubjectResponse, EnrolledStudentResponse, CreateCertificateRequestFields, GetStudentRequestsResponse, GetRequestByIdResponse, MakeCertificateRequestResponse
from app.models import User, UserRole, Subject, StudentSubject, Request, RequestStatus


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


@router.get('/subject/requests/{subject_id}', response_model=GetStudentRequestsResponse)
def get_student_requests_for_a_subject(subject_id: str, db: Session = Depends(get_db), current_teacher: TokenData = Depends(get_current_teacher)):
    # requests for a particular subject
    requests = db.query(Request).filter(
        Request.subject_id == subject_id,
        Request.teacher_id == current_teacher.user_id
    ).all()
    return {
        'requests': [
            {
               'id': request.id,
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
                'updated_at': request.updated_at,
                'due_date': request.due_date,
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

@router.get('/requests/{request_id}', response_model=GetRequestByIdResponse)
def get_request_info_by_id(
    request_id: str,
    db: Session = Depends(get_db),
    current_teacher: TokenData = Depends(get_current_teacher)
):
    request = db.query(Request).filter(Request.id == request_id).first()

    if not request:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Request not found")

    if request.teacher_id != current_teacher.user_id:
        raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail="You are not authorized to view this request")
    
    return {
        'request': {
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
            'updated_at': request.updated_at,
            'due_date': request.due_date,
        }
    }

@router.post('/students/request', response_model=MakeCertificateRequestResponse)
def make_certificate_request_to_student(
    student_request_data_list: List[CreateCertificateRequestFields] = Body(embed=True),
    db: Session = Depends(get_db),
    current_teacher = Depends(get_current_teacher)
):
    results = []

    for student_data in student_request_data_list:
        try:
            db_student = db.query(User).filter(User.id == student_data.student_id).first()
            if not db_student:
                results.append({
                    'student_id': student_data.student_id,
                    'subject_id': student_data.subject_id,
                    'success': False,
                    'message': 'Student does not exist'
                })
                continue
            
            db_subject = db.query(Subject).filter(Subject.id == student_data.subject_id).first()
            if not db_subject:
                results.append({
                    'student_id': student_data.student_id,
                    'subject_id': student_data.subject_id,
                    'success': False,
                    'message': 'Subject does not exist'
                })
                continue
            
            # Check if the student has already requested a certificate
            existing_request = db.query(Request).filter(
                Request.student_id == db_student.id,
                Request.status == 'pending'
            ).first()

            if existing_request:
                results.append({
                    'student_id': student_data.student_id,
                    'subject_id': student_data.subject_id,
                    'success': False,
                    'message': 'Student has already been requested for certificate',
                    'request_id': existing_request.id
                })
                continue
                
            # Create a new request
            coordinator = db.query(User).filter(
                User.role == UserRole.teacher,
                User.id == current_teacher.user_id
            ).first()

            if not coordinator:
                raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Coordinator not found")

            certificate_request = Request(
                student_id=db_student.id,
                subject_id=student_data.subject_id,  # Assuming this is a general request
                teacher_id=coordinator.id,  # Assigning the coordinator's ID
                due_date=student_data.due_date,
                status=RequestStatus.pending,
            )

            db.add(certificate_request)
            db.commit()
            db.refresh(certificate_request)

            results.append({
                'student_id': student_data.student_id,
                'subject_id': student_data.subject_id,
                'success': True,
                'message': 'Certificate request created successfully',
                'request_id': certificate_request.id
            })

        except Exception as e:
            db.rollback()
            results.append({
                'student_id': student_data.student_id,
                'subject_id': student_data.subject_id,
                'success': False,
                'message': str(e)
            })

    return {
        'results': results
    }
            