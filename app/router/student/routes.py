from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session

from app.config.db import get_db
from app.models import User, RequestStatus
from app.schemas import TokenData

from app.oauth2 import get_current_student


router = APIRouter(prefix="/student")


@router.get('/pending')
def get_pending_requests(
    current_student: TokenData = Depends(get_current_student), db: Session = Depends(get_db),
):
   try:
        student = db.query(User).filter(User.id == current_student.user_id).one()
        pending_requests = filter(
            lambda x: x.status == RequestStatus.pending,
            student.requests_received
        )
        return [
            {
                'subject_id': request.subject.id,
                'subject': request.subject,
                'teacher_id': request.teacher.id,
                'teacher': request.teacher,
            }
            for request in pending_requests
        ]
   except Exception as e:
        db.rollback()
        print(e)
        raise e

# TODO: Make a single route for all types of requests with request status as a body parameter
@router.get('/completed')
def get_completed_requests(
    current_student: TokenData = Depends(get_current_student), db: Session = Depends(get_db),
):
   try:
        student = db.query(User).filter(User.id == current_student.user_id).one()
        completed_requests = filter(
            lambda x: x.status == RequestStatus.completed,
            student.requests_received
        )
        return [
            {
                'subject_id': request.subject.id,
                'subject': request.subject,
                'teacher_id': request.teacher.id,
                'teacher': request.teacher,
            }
            for request in completed_requests
        ]
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
    