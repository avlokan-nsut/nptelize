from pydantic import BaseModel, EmailStr
from typing import List

# -----------------------------------------------------------------------
# Request Schemas
# -----------------------------------------------------------------------

class UserBase(BaseModel):
    name: str
    email: EmailStr
    password: str
    
class StudentCreate(UserBase):
    roll_number: str
    
class TeacherCreate(UserBase):
    employee_id: str

class AdminCreate(UserBase):
    employee_id: str

class SubjectCreate(BaseModel):
    name: str
    subject_code: str
    nptel_course_code: str

class AddStudentToSubjectSchema(BaseModel):
    email: str
    course_code: str

class AddTeacherToSubjectSchema(BaseModel):
    email: str
    course_code: str

# -----------------------------------------------------------------------
# Response Schemas
# -----------------------------------------------------------------------

class UserResponseFields(BaseModel):
    email: str
    success: bool
    message: str

class CreateStudentResponseFields(UserResponseFields):
    subject_code: str

class CreateStudentResponse(BaseModel):
    results: List[CreateStudentResponseFields]
    
class CreateUserResponse(BaseModel):
    results: List[UserResponseFields]


class SubjectCreateResponseFields(BaseModel):
    subject_code: str
    nptel_course_code: str
    success: bool
    message: str

class CreateSubjectResponse(BaseModel):
    results: List[SubjectCreateResponseFields]