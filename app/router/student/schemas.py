from pydantic import BaseModel
from typing import List, Optional
from datetime import datetime


# -----------------------------------------------------------------------
# Request Schemas
# -----------------------------------------------------------------------

class StudentLoginRequest(BaseModel):
    email: str
    password: str 


# -----------------------------------------------------------------------
# Response Schemas
# -----------------------------------------------------------------------


class Teacher(BaseModel):
    id: str
    name: str

class Subject(BaseModel):
    id: str
    code: str
    name: str
    teacher: Teacher

class CertificateRequest(BaseModel):
    request_id: str
    subject: Subject
    status: str
    certificate_uploaded_at: Optional[datetime] = None
    due_date: Optional[datetime] = None

class CertificateRequestResponse(BaseModel):
    requests: List[CertificateRequest]

class CertificateResponse(BaseModel):
    id: str
    request_id: str
    student_id: str
    file_url: str
    verified: bool
    uploaded_at: datetime
    updated_at: datetime

class StudentSubjectsResponse(BaseModel):
    subjects: List[Subject]