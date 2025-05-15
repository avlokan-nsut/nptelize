from pydantic import BaseModel
from typing import List
from datetime import datetime

# -----------------------------------------------------------------------
# Request Schemas
# -----------------------------------------------------------------------

class TeacherLoginRequest(BaseModel):
    email: str
    password: str

class AddStudentToSubjectSchema(BaseModel):
    email: str
    subject_id: str

# -----------------------------------------------------------------------
# Response Schemas
# -----------------------------------------------------------------------

class Subject(BaseModel):
    id: str
    name: str
    subject_code: str
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
    status: str
    created_at: datetime
    
class GetStudentRequestsResponse(BaseModel):
    requests: List[StudentCertificateRequest]