from fastapi import APIRouter, Depends, HTTPException, status, Body, Query, UploadFile

from sqlalchemy.orm import Session
from sqlalchemy.ext.asyncio import AsyncSession

from typing import List, cast

from app.config import config
from app.config.db import get_db, get_async_db
from app.oauth2 import get_current_teacher
from app.schemas import TokenData, GenericResponse
from app.router.teacher.schemas import SubjectResponse, EnrolledStudentResponse, CreateCertificateRequestFields, GetStudentRequestsResponse, GetRequestByIdResponse, MakeCertificateRequestResponse, CertificateResponse
from app.models import User, UserRole, Subject, StudentSubject, Request, RequestStatus, Certificate

from app.services.utils.limiter import process_upload
from app.services.utils.file_storage import save_file_to_local_storage
from app.services.utils.extractor import extract_student_info_from_pdf
from app.services.utils.qr_extraction import extract_link
from app.services.verifier import Verifier, COURSE_NAME_SINGLE_LINE_CHARACTER_LIMIT


router = APIRouter(prefix="/teacher")

CERTIFICATES_FOLDER_PATH = config['CERTIFICATES_FOLDER_PATH']
print(CERTIFICATES_FOLDER_PATH)

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
                    'nptel_course_code': request.subject.nptel_course_code,
                    'teacher_id': request.subject.teacher_id,
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
                Request.status == 'pending',
                Request.subject_id == student_data.subject_id 
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
            
@router.post('/stray/requests')
async def get_stray_certificates(
    current_teacher: TokenData = Depends(get_current_teacher),
    db: AsyncSession = Depends(get_async_db)
):
    from app.config.db import AsyncSessionLocal
    from app.services.cleanup import CleanupService

    cleanup_service = CleanupService(AsyncSessionLocal)

    return await cleanup_service.get_stale_processing_certificates(db)
    

@router.post('/verify/certificate/manual', response_model=GenericResponse)
async def verify_certificate_manual(
    request_id: str = Query(),
    subject_id: str = Query(),
    student_id: str = Query(),
    file: UploadFile = Depends(process_upload),
    current_teacher = Depends(get_current_teacher),
    db: Session = Depends(get_db)
):
    db_request = db.query(Request).filter(
        Request.id == request_id,
        Request.student_id == student_id,
        Request.subject_id == subject_id,
        Request.teacher_id == current_teacher.user_id
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
        is_subject_name_long=isinstance(db_request.subject.name, str) and (
            len(db_request.subject.name.strip()) > COURSE_NAME_SINGLE_LINE_CHARACTER_LIMIT
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



@router.get('/certificate/details/{request_id}', response_model=CertificateResponse)
async def get_verified_certificate_details(
    request_id: str,
    current_teacher = Depends(get_current_teacher),
    db: Session = Depends(get_db)
):
    db_request = db.query(Request).filter(
        Request.id == request_id,
        Request.teacher_id == current_teacher.user_id
    ).first()

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
        cast(str,db_request.student_id), 
        db,
    )

    certificate_data = await verifier.manual_verification(cast(str, db_request.subject.name))

    response =  {
        "message": "Certificate details fetched successfully",
        "data": {
            **certificate_data, 
            "subject_name": db_request.subject.name,
            "remark": db_certificate.remark
        }
    }
    return response
