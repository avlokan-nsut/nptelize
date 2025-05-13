from pydantic import BaseModel
from typing import List

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
# Request Schemas
# -----------------------------------------------------------------------

class Subject(BaseModel):
    id: str
    name: str
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