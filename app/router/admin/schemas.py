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
    teacher_id: str

# -----------------------------------------------------------------------
# Response Schemas
# -----------------------------------------------------------------------

class UserResponseFields(BaseModel):
    email: str
    success: bool
    message: str
class CreateUserResponse(BaseModel):
    results: List[UserResponseFields]

class SubjectCreateResponseFields(BaseModel):
    subject_code: str
    success: bool
    message: str

class CreateSubjectResponse(BaseModel):
    results: List[SubjectCreateResponseFields]