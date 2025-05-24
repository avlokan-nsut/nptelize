from datetime import datetime
from pydantic import BaseModel, EmailStr
from typing import Optional

from app.models import UserRole, RequestStatus

class TokenData(BaseModel):
    user_id: str
    role: str

class GenericResponse(BaseModel):
    message: str

class User(BaseModel):
    id: str
    name: str
    email: EmailStr
    role: UserRole
        
class Student(User):
    roll_number: str

class Teacher(BaseModel):
    employee_id: str

class Admin(BaseModel):
    employee_id: str

class Subject(BaseModel):
    id: str
    name: str
    subject_code: str
    nptel_course_code: str
    teacher_id: str

class Request(BaseModel):
    id: str
    subject_id: str
    student_id: str
    teacher_id: str
    status: RequestStatus
    due_date: datetime

class Certificate(BaseModel):
    id: str
    request_id: str
    file_url: str
    verification_file_url: Optional[str] = None
    verified_total_marks: Optional[int] = None
    verfied: bool
    remark: Optional[int] = None