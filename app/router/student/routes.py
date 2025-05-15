from fastapi import APIRouter, Depends, Body
from sqlalchemy.orm import Session
from typing import List

from app.config.db import get_db
from app.models import User, RequestStatus, StudentSubject, Subject
from app.schemas import TokenData
from app.router.student.schemas import CertificateRequestResponse, StudentSubjectsResponse

from app.oauth2 import get_current_student


router = APIRouter(prefix="/student")


@router.post('/requests', response_model=CertificateRequestResponse)
def get_certificate_requests(
    request_types: List[RequestStatus] = Body(embed=True),
    db: Session = Depends(get_db),
    current_student: TokenData = Depends(get_current_student),
):
    request_types = list(set(request_types))
    try: 
        student = db.query(User).filter(User.id == current_student.user_id).one()
        filtered_requests = filter(
            lambda x: x.status in request_types,
            student.requests_received
        )
        return {
            'requests': [
                {
                    'subject_id': request.subject.id,
                    'subject': request.subject.name,
                    'teacher_id': request.teacher.id,
                    'teacher': request.teacher.name,
                    'status': request.status,
                }
                for request in filtered_requests
            ]
        } 
    except Exception as e:
        db.rollback()
        print(e)
        raise e

@router.get('/subjects', response_model=StudentSubjectsResponse)
def get_student_subjects(
    db: Session = Depends(get_db),
    current_student: TokenData = Depends(get_current_student),
):
    try:
        subjects = db.query(Subject).join(
            StudentSubject,
            Subject.id == StudentSubject.subject_id
        ).filter(StudentSubject.student_id == current_student.user_id).all()
        
        return {
            'subjects': [
                {
                    'id': subject.id,
                    'code': subject.subject_code,
                    'name': subject.name,
                    'teacher': {
                        'id': subject.teacher.id,
                        'name': subject.teacher.name,
                    }
                }
                for subject in subjects
            ]
        }
    except Exception as e:
        db.rollback()
        print(e)
        raise e

@router.post('/upload')
def upload_certificate(
    request_id: str,
):
    pass
    # enforce size and type contraints on this file
    # upload the file to cloud
    # set the request status to processing
    # perform basic checks for the information in the file (ocr)
    # ensure the integrity of the qr code link
    # download the verification qr code file to verify the certificate
    # perform the verification 
    # if verified, set the request status to completed, return the request
    # if not verified, set the request status to error
    