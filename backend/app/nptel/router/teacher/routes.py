from fastapi import APIRouter, Depends, HTTPException, status, Body, Query, UploadFile

from sqlalchemy import and_
from sqlalchemy.orm import Session
from sqlalchemy.ext.asyncio import AsyncSession

from typing import List, cast

from app.config import config
from app.database.core import get_db, get_async_db
from app.oauth2 import get_current_teacher
from app.schemas import TokenData, GenericResponse
from .schemas import (
    SubjectResponse, 
    EnrolledStudentResponse, 
    CreateCertificateRequestFields, 
    GetStudentRequestsResponse, 
    GetRequestByIdResponse, 
    MakeCertificateRequestResponse, 
    CertificateResponse,
    UnsafeManualVerificationRequest
)
from app.database.models import User, StudentSubjectEnrollment, Request, RequestStatus, Certificate, TeacherSubjectAllotment
from app.services.log_service import setup_logger

from app.services.utils.limiter import process_upload
from app.services.utils.file_storage import save_file_to_local_storage
from app.services.utils.extractor import extract_student_info_from_pdf
from app.services.utils.qr_extraction import extract_link
from app.services.verifier import Verifier, COURSE_NAME_SINGLE_LINE_CHARACTER_LIMIT

from .service import get_teacher_alloted_subjects, get_student_requests_for_subject, get_students_of_a_subject_allotment
from ...oauth2 import role_based_access

logger = setup_logger(__name__)

router = APIRouter(prefix="/teacher")

CERTIFICATES_FOLDER_PATH = config['CERTIFICATES_FOLDER_PATH']
logger.info(f"Certificates folder path: {CERTIFICATES_FOLDER_PATH}")


def check_coordinator(current_teacher: TokenData = Depends(get_current_teacher)):
    service_role_dict = current_teacher.service_role_dict
    return 'nptel' in service_role_dict and 'coordinator' 
    
@router.get('/subjects', response_model=SubjectResponse)
def get_alloted_subjects(
    year: int = Query(),
    sem: int = Query(),
    db: Session = Depends(get_db),
    current_teacher: TokenData = Depends(get_current_teacher),
    is_coordinator: bool = Depends(check_coordinator)
):
    is_sem_odd = bool(sem & 1)

    subjects = get_teacher_alloted_subjects(db, current_teacher.user_id, year, is_sem_odd, is_coordinator)
    
    return {
        'subjects': subjects
    }


@router.get('/subject/requests/{subject_id}', response_model=GetStudentRequestsResponse)
def get_student_requests_for_a_subject(
    subject_id: str, 
    year: int = Query(),
    sem: int = Query(),
    db: Session = Depends(get_db), 
    current_teacher: TokenData = Depends(get_current_teacher),
    is_coordinator: bool = Depends(check_coordinator)
):
    is_sem_odd = bool(sem & 1)
    
    requests = get_student_requests_for_subject(
        db, current_teacher.user_id, subject_id, year, is_sem_odd, is_coordinator
    )

    return {
        'requests': [
            {
               'id': request.id,
               'student': {
                    'id': request.student_subject_enrollment.student.id,
                    'name': request.student_subject_enrollment.student.name,
                    'email': request.student_subject_enrollment.student.email,
                    'roll_number': request.student_subject_enrollment.student.roll_number,
                },
                'subject': {
                    'id': request.student_subject_enrollment.teacher_subject_allotment.subject.id,
                    'name': request.student_subject_enrollment.teacher_subject_allotment.subject.name,
                    'subject_code': request.student_subject_enrollment.teacher_subject_allotment.subject.subject_code,
                    'nptel_course_code': request.student_subject_enrollment.teacher_subject_allotment.subject.nptel_course_code,
                    'teacher_id': request.student_subject_enrollment.teacher_subject_allotment.teacher_id,
                },
                'verified_total_marks': request.certificate.verified_total_marks if request.certificate else None,
                'status': request.status,
                'created_at': request.created_at,
                'updated_at': request.updated_at,
                'due_date': request.due_date,
            }
            for request in requests
        ]
    }


@router.get('/students/{subject_id}', response_model=EnrolledStudentResponse)
def get_students_enrolled_in_a_subject(
    subject_id: str,
    year: int = Query(),
    sem: int = Query(),
    db: Session = Depends(get_db),
    current_teacher: TokenData = Depends(get_current_teacher),
    is_coordinator: bool = Depends(check_coordinator)
):
    is_sem_odd = bool(sem & 1)

    enrollments = get_students_of_a_subject_allotment(
        db, current_teacher.user_id, subject_id, year, is_sem_odd, is_coordinator
    )

    return {
        'enrolled_students': [enrollment.student for enrollment in enrollments] if enrollments else []
    }

@router.get('/requests/{request_id}', response_model=GetRequestByIdResponse)
def get_request_info_by_id(
    request_id: str,
    db: Session = Depends(get_db),
    current_teacher: TokenData = Depends(get_current_teacher),
    is_coordinator: bool = Depends(check_coordinator)
):
    request = db.query(Request).filter(Request.id == request_id).first()

    if not request:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Request not found")

    if not is_coordinator and request.student_subject_enrollment.teacher_subject_allotment.teacher_id != current_teacher.user_id:
        raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail="You are not authorized to view this request")
    
    return {
        'request': {
            'student': {
                'id': request.student_subject_enrollment.student.id,
                'name': request.student_subject_enrollment.student.name,
                'email': request.student_subject_enrollment.student.email,
                'roll_number': request.student_subject_enrollment.student.roll_number,
            },
            'subject': {
                'id': request.student_subject_enrollment.teacher_subject_allotment.subject.id,
                'name': request.student_subject_enrollment.teacher_subject_allotment.subject.name,
                'subject_code': request.student_subject_enrollment.teacher_subject_allotment.subject.subject_code,
                'teacher_id': request.student_subject_enrollment.teacher_subject_allotment.teacher_id,
            },
            'status': request.status,
            'created_at': request.created_at,
            'updated_at': request.updated_at,
            'due_date': request.due_date,
        }
    }


@router.get('/certificate/details/{request_id}', response_model=CertificateResponse)
async def get_verified_certificate_details(
    request_id: str,
    current_teacher = Depends(get_current_teacher),
    db: Session = Depends(get_db),
    is_coordinator: bool = Depends(check_coordinator)
):
    # Build query conditions conditionally
    query = db.query(Request).filter(Request.id == request_id)
    
    if not is_coordinator:
        query = query.filter(
            Request.student_subject_enrollment.has(
                StudentSubjectEnrollment.teacher_subject_allotment.has(
                    TeacherSubjectAllotment.teacher_id == current_teacher.user_id
                )
            )
        )
    
    db_request = query.first()

    if db_request is None:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Request not found")

    db_certificate = db.query(Certificate).filter(
        Certificate.request_id == request_id,
    ).first()

    if db_certificate is None:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Verified certificate not found")

    uploaded_file_path = f"{CERTIFICATES_FOLDER_PATH}/{db_certificate.file_url}"
    
    verifier = Verifier(
        cast(str, db_certificate.file_url), 
        uploaded_file_path, 
        request_id, 
        cast(str,db_request.student_subject_enrollment.student_id), 
        db,
    )

    certificate_data = await verifier.manual_verification(
        cast(str, db_request.student_subject_enrollment.teacher_subject_allotment.subject.name)
    )

    response =  {
        "message": "Certificate details fetched successfully",
        "data": {
            **certificate_data, 
            "subject_name": db_request.student_subject_enrollment.teacher_subject_allotment.subject.name,
            "remark": db_certificate.remark
        }
    }
    return response


@router.post('/students/request', response_model=MakeCertificateRequestResponse)
def make_certificate_request_to_student(
    student_request_data_list: List[CreateCertificateRequestFields] = Body(embed=True),
    year: int = Query(),
    sem: int = Query(),
    db: Session = Depends(get_db),
    current_coordinator: TokenData = Depends(role_based_access(['coordinator']))
):
    is_sem_odd = bool(sem & 1)
    
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
            
            db_subject_enrollment = db.query(StudentSubjectEnrollment).filter(
                StudentSubjectEnrollment.student_id == db_student.id,
                StudentSubjectEnrollment.teacher_subject_allotment.has(
                    and_(
                        TeacherSubjectAllotment.subject_id == student_data.subject_id,
                        TeacherSubjectAllotment.year == year,
                        TeacherSubjectAllotment.is_sem_odd == is_sem_odd
                    )
                )
            ).first()

            if not db_subject_enrollment:
                results.append({
                    'student_id': student_data.student_id,
                    'subject_id': student_data.subject_id,
                    'success': False,
                    'message': 'Subject does not exist'
                })
                continue
            
            # Check if the student has already requested a certificate
            existing_request = db.query(Request).filter(
                Request.status == 'pending',
                Request.student_subject_enrollment.has(
                    StudentSubjectEnrollment.student_id == db_student.id,
                )
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
                
            certificate_request = Request(
                student_subject_enrollment_id=db_subject_enrollment.id,
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
            

@router.post('/stray/requests')
async def get_stray_certificates(
    current_teacher: TokenData = Depends(get_current_teacher),
    db: AsyncSession = Depends(get_async_db)
):
    from app.database.core import AsyncSessionLocal
    from app.services.cleanup import CleanupService

    cleanup_service = CleanupService(AsyncSessionLocal)

    return await cleanup_service.get_stale_processing_certificates(db)
    

@router.post('/verify/certificate/manual', response_model=GenericResponse)
async def verify_certificate_manual(
    request_id: str = Query(),
    subject_id: str = Query(),
    student_id: str = Query(),
    file: UploadFile = Depends(process_upload),
    db: Session = Depends(get_db),
    current_coordinator: TokenData = Depends(role_based_access(['coordinator'])),
):
    db_request = db.query(Request).filter(
        Request.id == request_id,
        Request.student_subject_enrollment.has(
            StudentSubjectEnrollment.student_id == student_id,
        )
    ).first()

    if not db_request:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Request not found")
    
    db_certificate = db.query(Certificate).filter(
       Certificate.request_id == request_id, 
    ).first()

    relative_file_path = f"{request_id}.pdf"
    file_path = f"{CERTIFICATES_FOLDER_PATH}/{relative_file_path}"

    await save_file_to_local_storage(
        file, file_path
    )

    # extract details from certificate file
    (
        course_name, 
        student_name, 
        total_marks, 
        roll_no, 
        course_period 
    ) = extract_student_info_from_pdf(
        file_path, 
        is_subject_name_long=isinstance(db_request.student_subject_enrollment.teacher_subject_allotment.subject.name, str) and (
            len(db_request.student_subject_enrollment.teacher_subject_allotment.subject.name.strip()) > COURSE_NAME_SINGLE_LINE_CHARACTER_LIMIT
        )
    ) 

    # check for missing details
    if not course_name or not student_name or not total_marks or not roll_no or not course_period:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="Invalid certificate file")

    verification_link = extract_link(file_path, 0)

    # TODO: can add pdf file verification

    if not db_certificate:
        db_certificate = Certificate(
            request_id=request_id,
            student_id=student_id,
            file_url=file.filename,  # Assuming the file is saved and this is the path
            verified=False,
        )
        db.add(db_certificate)
        db.commit()
        db.refresh(db_certificate)
    
    db_certificate.file_url = relative_file_path
    db_certificate.verification_file_url = verification_link
    db_certificate.verified_total_marks = int(total_marks)
    db_certificate.verified = True
    db_certificate.remark = "Manual verification by teacher"

    db_request.status = RequestStatus.completed
    db.commit()

    return {'message': 'Certificate verified successfully'}


@router.put('/reject/certificate', response_model=GenericResponse)
def reject_certificate_under_review(
    request_id: str = Query(),
    db: Session = Depends(get_db),
    current_coordinator: TokenData = Depends(role_based_access(['coordinator'])),
):
    """
    Reject a certificate request that is currently under review.
    Only teachers can reject requests assigned to them.
    """

    # Verify the request exists and belongs to the current teacher
    db_request = db.query(Request).filter(
        Request.id == request_id,
    ).first()

    if not db_request:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND, 
            detail="Request not found or you are not authorized to access this request"
        )

    # Check if the request is in pending status
    if db_request.status == RequestStatus.pending:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Cannot reject request with status. Only requests with 'under_review' status can be rejected."
        )

    # Get the associated certificate
    db_certificate = db.query(Certificate).filter(
        Certificate.request_id == request_id
    ).first()

    if not db_certificate:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Certificate not found for this request"
        )

    try:
        # Update request status to rejected
        db_request.status = RequestStatus.rejected
        
        # Update certificate details
        db_certificate.verified = False
        db_certificate.remark = "Manually rejected by teacher after review"
        
        # Commit the changes
        db.commit()
        
        logger.info(f"Request {request_id} rejected by coordinator {current_coordinator.user_id}")
        
        return {
            'message': 'Certificate request has been successfully rejected'
        }
        
    except Exception as e:
        db.rollback()
        logger.error(f"Error rejecting certificate request {request_id}: {str(e)}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="An error occurred while rejecting the certificate request"
        )


@router.post('/verify/certificate/manual/unsafe', response_model=GenericResponse)
def verify_certificate_manual_unsafe(
    verification_data: UnsafeManualVerificationRequest,
    db: Session = Depends(get_db),
    current_coordinator: TokenData = Depends(role_based_access(['coordinator'])),
):
    request_id = verification_data.request_id
    total_marks = verification_data.marks
    
    db_request = db.query(Request).filter(
        Request.id == request_id,
    ).first()

    if not db_request:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Request not found")
    
    db_certificate = db.query(Certificate).filter(
       Certificate.request_id == request_id, 
    ).first()

    if not db_certificate:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="The student's certificate was not found")

    relative_file_path = db_certificate.file_url
    file_path = f"{CERTIFICATES_FOLDER_PATH}/{relative_file_path}"

    verification_link = extract_link(file_path, 0)

    db_certificate.file_url = relative_file_path
    db_certificate.verification_file_url = verification_link
    db_certificate.verified_total_marks = total_marks
    db_certificate.verified = True
    db_certificate.remark = "Manual verification by teacher"

    db_request.status = RequestStatus.completed
    db.commit()

    return {'message': 'Certificate verified successfully'}
