from pydantic import BaseModel, EmailStr
from app.models import UserRole

# -----------------------------------------------------------------------
# Request Schemas
# -----------------------------------------------------------------------

class UserBase(BaseModel):
    name: str
    email: EmailStr
    password: str
    role: UserRole
    
class StudentCreate(UserBase):
    roll_number: str
    
class TeacherCreate(UserBase):
    employee_id: str

class AdminCreate(UserBase):
    employee_id: str