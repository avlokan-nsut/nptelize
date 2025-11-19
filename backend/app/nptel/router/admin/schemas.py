from pydantic import BaseModel, EmailStr
from typing import List, Optional, Literal


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


class CreateTeacherResponseFields(UserResponseFields):
    employee_id: str


class CreateTeacherResponse(BaseModel):
    results: List[CreateTeacherResponseFields]
    
    
class CreateUserResponse(BaseModel):
    results: List[UserResponseFields]


class SubjectCreateResponseFields(BaseModel):
    subject_code: str
    nptel_course_code: str
    success: bool
    message: str


class CreateSubjectResponse(BaseModel):
    results: List[SubjectCreateResponseFields]


class ModifyUserRoleResponse(BaseModel):
    email: EmailStr
    old_role: Optional[str]
    new_role: str
    success: bool
    message: str

class RoleEntry(BaseModel):
    id: str
    module_name: str
    name: str


class RoleQueryResponse(BaseModel):
    email: EmailStr
    role: Optional[str]
    custom_roles: Optional[List[RoleEntry]]


class RolesResponse(BaseModel):
    builtin_roles: List[str]
    custom_roles: List[RoleEntry]
    
class ModifyUserRoleRequest(BaseModel):
    email: EmailStr
    new_role: str
    

class ModifyCoordinatorRequest(BaseModel):
    email: EmailStr
    module_name: str
    role_name: str
    action: Literal["add", "remove"]
    
    
class ModifyCoordinatorResponse(BaseModel):
    email: EmailStr
    module_name: str
    role_name: str
    action: Literal["add", "remove"]
    success: bool
    message: str