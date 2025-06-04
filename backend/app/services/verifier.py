from fastapi import HTTPException, status
from datetime import datetime, timezone
from sqlalchemy.orm import Session
from typing import Tuple, Optional, cast, Dict

from app.models import Request, RequestStatus, Certificate

from .utils.qr_extraction import extract_link
from .utils.downloader import download_verification_pdf
from .utils.extractor import extract_student_info_from_pdf

import tempfile

COURSE_NAME_SINGLE_LINE_CHARACTER_LIMIT = 57

class Verifier:
    def __init__(self, uploaded_file_path_relative: str, uploaded_file_path: str, request_id: str, student_id: str, db: Session):
        self.uploaded_file_path_relative = uploaded_file_path_relative
        self.uploaded_file_path = uploaded_file_path
        self.request_id = request_id
        self.student_id = student_id
        self.db = db
        self.verification_filename = None
    
    async def start_verification(self) -> None:
        # update db request status to processing
        db_request = self.db.query(Request).filter(
            Request.id == self.request_id,
            Request.student_id == self.student_id
        ).first()

        if not db_request:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="Request not found or does not belong to the current student"
            ) 
        
        offset_aware_due_date = db_request.due_date.replace(tzinfo=timezone.utc) if db_request.due_date else None
        print(f"Offset aware due date: {offset_aware_due_date}")

        if offset_aware_due_date and datetime.now(timezone.utc) > offset_aware_due_date: 
            raise HTTPException(
                status_code=status.HTTP_403_FORBIDDEN,
                detail="Request is past the due date"
            )

        db_request.status = RequestStatus.processing

        # add the uploaded certificate details to the db

        db_certificate = self.db.query(Certificate).filter(
            Certificate.request_id == self.request_id
        ).first()

        if not db_certificate:
            db_certificate = Certificate(
                request_id=self.request_id,
                student_id=self.student_id,
                file_url=self.uploaded_file_path_relative,
                verified=False,
            )
            self.db.add(db_certificate)

        try:
            self.db.commit()
            self.db.refresh(db_request)
            self.db.refresh(db_certificate)
        except Exception as e:
            self.db.rollback()
            self.update_status_to_error(db_request, db_certificate, "An internal server error occurred")
            raise e

        verification_link = extract_link(self.uploaded_file_path, 0)
        if not verification_link:
            self.update_status_to_rejected(db_request, db_certificate, "Verification link / QR not found")
            return

        with tempfile.NamedTemporaryFile(mode='w+', delete=True, suffix=".pdf", prefix="certificate_") as temp_f:
            print(f"Temporary file created at: {temp_f.name}")
            success, pdf_url, output = await download_verification_pdf(verification_link, temp_f.name)

            if not success:
                remark =  "Could not download the verification pdf"
                self.update_status_to_error(db_request, db_certificate, remark)
                raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail=remark)

            db_certificate.verification_file_url = pdf_url

            self.db.commit()
            self.db.refresh(db_request)
            self.db.refresh(db_certificate)
            

            success, output, verified_roll_no, verified_total_marks = self.verify_file(
                temp_f.name,
                cast(str, db_request.subject.name),
                cast(str, db_request.student.name),
                is_subject_name_long=isinstance(db_request.subject.name, str) and (
                    len(db_request.subject.name.strip()) > COURSE_NAME_SINGLE_LINE_CHARACTER_LIMIT
                )
            )

            if not success:
                self.update_status_to_rejected(db_request, db_certificate, output)
                return
            
            # Now, since verification has been done, update the final status to all good
            db_request.status = RequestStatus.completed
            db_certificate.verified_total_marks = int(verified_total_marks)         # type: ignore
            db_certificate.verified = True
            db_certificate.remark = "Verification successful"
            self.db.commit()
    
    def verify_file(
        self, 
        verification_file_path: str, 
        subject_name: str, 
        student_name: str,
        is_subject_name_long: bool = False
    )-> Tuple[bool, str, Optional[str], Optional[str]]:
        (
            uploaded_course_name,
            uploaded_student_name,
            uploaded_total_marks,
            uploaded_roll_number,
            uploaded_course_period,
        ) = extract_student_info_from_pdf(self.uploaded_file_path, is_subject_name_long)

        (
            valid_course_name, 
            valid_student_name, 
            valid_total_marks, 
            valid_roll_number ,
            valid_course_period
        ) = extract_student_info_from_pdf(verification_file_path, is_subject_name_long)


        if (
            uploaded_course_name is None
            or uploaded_student_name is None
            or uploaded_total_marks is None
            or uploaded_roll_number is None
            or uploaded_course_period is None
        ):
            return False, "Invalid PDF uploaded. Data missing.", None, None
        
        if (
            valid_course_name is None
            or valid_student_name is None
            or valid_total_marks is None
            or valid_roll_number is None
            or valid_course_period is None
        ):
            return False, "Invalid details in the verification file", None, None

        print(
            f"Uploaded: {uploaded_course_name}, {uploaded_student_name}, {uploaded_total_marks}, {uploaded_roll_number}, {uploaded_course_period}"
        )
        print(
            f"Valid: {valid_course_name}, {valid_student_name}, {valid_total_marks}, {valid_roll_number}, {valid_course_period}"
        )

        if (uploaded_course_name.lower().strip() != valid_course_name.lower().strip()) or (
            uploaded_course_name.lower().strip() != subject_name.lower().strip()
        ):
            return False, "Course name mismatch", None, None

        if (uploaded_student_name.lower().strip() != valid_student_name.lower().strip()) or (
            uploaded_student_name.lower().strip() != student_name.lower().strip()
        ):
            return False, "Student name mismatch", None, None

        if uploaded_total_marks != valid_total_marks:
            return False, "Total marks mismatch", None, None

        if uploaded_roll_number != valid_roll_number:
            return False, "Roll number mismatch", None, None
        
        if uploaded_course_period != valid_course_period:
            return False, "Course period/year mismatch", None, None


        return (
            True,
            "Verification successful",
            valid_roll_number,
            valid_total_marks,
        )

    
    def update_status_to_rejected(
        self, 
        db_request: Request, 
        db_certificate: Certificate, 
        remark: str
    ) -> None:
        db_request.status = RequestStatus.rejected
        db_certificate.verified = False
        db_certificate.remark = remark

        self.db.commit()
        
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail=remark)
    
    def update_status_to_error(
        self, 
        db_request: Request, 
        db_certificate: Certificate, 
        remark: str
    ) -> None:
        db_request.status = RequestStatus.error
        db_certificate.verified = False
        db_certificate.remark = remark

        self.db.commit()
        
    async def manual_verification(
        self,
        course_name: str,
    ) -> Dict:
        is_subject_name_long = isinstance(self.uploaded_file_path, str) and (
            len(course_name.strip()) > COURSE_NAME_SINGLE_LINE_CHARACTER_LIMIT
        )

        verification_link = extract_link(self.uploaded_file_path, 0)
        if not verification_link:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="Verification link / QR not found"
            )

        with tempfile.NamedTemporaryFile(mode='w+', delete=True, suffix=".pdf", prefix="certificate_") as temp_f:
            print(f"Temporary file created at: {temp_f.name}")
            success, pdf_url, output = await download_verification_pdf(verification_link, temp_f.name)

            if not success:
                remark =  "Could not download the verification pdf"
                raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail=remark)

            (
                uploaded_course_name,
                uploaded_student_name,
                uploaded_total_marks,
                uploaded_roll_number,
                uploaded_course_period,
            ) = extract_student_info_from_pdf(self.uploaded_file_path, is_subject_name_long)

            (
                valid_course_name, 
                valid_student_name, 
                valid_total_marks, 
                valid_roll_number ,
                valid_course_period
            ) = extract_student_info_from_pdf(temp_f.name, is_subject_name_long)
        
        certificate_data = {
            "uploaded_certificate": {
                "student_name": uploaded_student_name,
                "roll_no": uploaded_roll_number,
                "marks": uploaded_total_marks,
                "course_name": uploaded_course_name,
                "course_period": uploaded_course_period,
                "file_url": self.uploaded_file_path_relative,
            },
            "verification_certificate": {
                "student_name": valid_student_name,
                "roll_no": valid_roll_number,
                "marks": valid_total_marks,
                "course_name": valid_course_name,
                "course_period": valid_course_period,
                "file_url": pdf_url
            },
        }
        return certificate_data