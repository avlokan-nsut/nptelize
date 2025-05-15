from pydantic import BaseModel
from typing import List
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
    subject: Subject
    status: str
    due_date: datetime | None

class CertificateRequestResponse(BaseModel):
    requests: List[CertificateRequest]


class StudentSubjectsResponse(BaseModel):
    subjects: List[Subject]