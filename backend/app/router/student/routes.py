from fastapi import APIRouter, Depends, Body, UploadFile, HTTPException, status
from sqlalchemy.orm import Session
from typing import List
import os

from app.config import config
from app.config.db import get_db
from app.models import User, RequestStatus, StudentSubject, Subject, Request, Certificate
from app.router.student.schemas import CertificateRequestResponse, StudentSubjectsResponse, CertificateResponse
from app.schemas import TokenData, GenericResponse
from app.services.verifier import Verifier
from app.services.utils.limiter import process_upload
from app.services.utils.file_storage import save_file_to_local_storage
from app.services.log_service import setup_logger

from app.oauth2 import get_current_student

logger = setup_logger(__name__)

router = APIRouter(prefix="/student")

CERTIFICATES_FOLDER_PATH = config['CERTIFICATES_FOLDER_PATH']

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
                    'request_id': request.id,
                    'subject': {
                        'id': request.subject.id,
                        'name': request.subject.name,
                        'code': request.subject.subject_code,
                        'nptel_course_code': request.subject.nptel_course_code,
                        'teacher': {
                            'id': request.teacher.id,
                            'name': request.teacher.name,
                        },
                    },
                    'verified_total_marks': request.certificate.verified_total_marks if request.certificate else None,
                    'status': request.status,
                    'due_date': request.due_date,
                    'certificate_uploaded_at': request.certificate.uploaded_at if request.certificate else None,
                }
                for request in filtered_requests
            ]
        } 
    except Exception as e:
        db.rollback()
        logger.error(f"Error getting certificate requests: {e}")
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
                    'nptel_course_code': subject.nptel_course_code,
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
        logger.error(f"Error getting student subjects: {e}")
        raise e

@router.get('/certificate/{request_id}', response_model=CertificateResponse | None)
def get_certificate(
    request_id: str,
    db: Session = Depends(get_db),
    current_student: TokenData = Depends(get_current_student),
):
    # check if the request_id belongs to the current student
    db_certificate = db.query(Certificate).filter(
        Certificate.request_id == request_id,
        Certificate.student_id == current_student.user_id
    ).first()

    if not db_certificate:
        return None

    return {
        'id': db_certificate.id,
        'request_id': db_certificate.request_id,
        'student_id': db_certificate.student_id,
        'file_url': db_certificate.file_url,
        'verified': db_certificate.verified,
        'uploaded_at': db_certificate.uploaded_at,
        'updated_at': db_certificate.updated_at,
    }

@router.post('/certificate/upload', response_model=GenericResponse)
async def upload_certificate(
    request_id: str,
    file: UploadFile = Depends(process_upload),
    db: Session = Depends(get_db),
    current_student: TokenData = Depends(get_current_student),
):
    # check if the request_id belongs to the current student
    db_request = db.query(Request).filter(
        Request.id == request_id,
        Request.student_id == current_student.user_id
    ).first()

    if not db_request:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Request not found or does not belong to the current student"
        )
    
    if db_request.status == RequestStatus.completed:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Request already completed"
        )
    
    if db_request.status == RequestStatus.processing:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Request already in processing"
        )

    os.makedirs(CERTIFICATES_FOLDER_PATH, exist_ok=True)

    relative_file_path = f"{request_id}.pdf"
    file_path = f"{CERTIFICATES_FOLDER_PATH}/{relative_file_path}"

    await save_file_to_local_storage(
        file,
        file_path
    )

    # set the request status to processing
    verifier = Verifier(
        uploaded_file_path_relative=relative_file_path,
        uploaded_file_path=file_path,
        request_id=request_id,
        student_id=current_student.user_id,
        db=db
    )

    await verifier.start_verification()

    return {'message': 'Certificate uploaded successfully'}

@router.put('/update/request-status/no-certificate', response_model=GenericResponse)
def upload_reqeust_status_to_no_certificate(
    request_id: str,
    db: Session = Depends(get_db),
    current_student: TokenData = Depends(get_current_student)
):
    # the request must exist (and belong to the student)
    db_request = db.query(Request).filter(
        Request.id == request_id,
        Request.student_id == current_student.user_id,
    ).first()

    if not db_request:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND, 
            detail="The given request does not exist or does not belong to the student"
        )
    
    # the request must not be completed
    if db_request.status == RequestStatus.completed:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST, 
            detail="The request has already been fulfilled"
        )

    # update the status
    db_request.status = RequestStatus.no_certificate
    db.commit()
    
    return {'message': 'successfull'}