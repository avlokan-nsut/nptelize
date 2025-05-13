from pydantic import BaseModel
from typing import List


# -----------------------------------------------------------------------
# Request Schemas
# -----------------------------------------------------------------------

class StudentLoginRequest(BaseModel):
    email: str
    password: str 


# -----------------------------------------------------------------------
# Response Schemas
# -----------------------------------------------------------------------

class CertificateRequest(BaseModel):
    subject_id: str
    subject: str
    teacher_id: str
    teacher: str

class CertificateRequestResponse(BaseModel):
    requests: List[CertificateRequest]

class Teacher(BaseModel):
    id: str
    name: str

class Subject(BaseModel):
    id: str
    code: str
    name: str
    teacher: Teacher

class StudentSubjectsResponse(BaseModel):
    subjects: List[Subject]