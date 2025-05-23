from pydantic import BaseModel
from typing import List, Optional
from datetime import datetime

# -----------------------------------------------------------------------
# Request Schemas
# -----------------------------------------------------------------------

class TeacherLoginRequest(BaseModel):
    email: str
    password: str



class CreateCertificateRequestFields(BaseModel):
    student_id: str
    subject_id: str
    due_date: Optional[datetime] = None

# -----------------------------------------------------------------------
# Response Schemas
# -----------------------------------------------------------------------

class Subject(BaseModel):
    id: str
    name: str
    subject_code: str
    nptel_course_code: str
    teacher_id: str

class SubjectResponse(BaseModel):
    subjects: List[Subject]

class EnrolledStudent(BaseModel):
    id: str
    name: str
    email: str
    roll_number: str

class EnrolledStudentResponse(BaseModel):
    enrolled_students: List[EnrolledStudent]

class StudentCertificateRequest(BaseModel):
    student: EnrolledStudent
    subject: Subject
    verified_total_marks: Optional[int] = None
    status: str
    created_at: datetime
    updated_at: datetime
    due_date: Optional[datetime] = None
    
class GetStudentRequestsResponse(BaseModel):
    requests: List[StudentCertificateRequest]

class GetRequestByIdResponse(BaseModel):
    request: StudentCertificateRequest

class MakeCertificateRequestResult(BaseModel):
    success: bool
    message: str
    request_id: Optional[str] = None
    student_id: str
    subject_id: str

class MakeCertificateRequestResponse(BaseModel):
    results: List[MakeCertificateRequestResult]