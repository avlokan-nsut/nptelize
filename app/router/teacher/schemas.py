from pydantic import BaseModel

# -----------------------------------------------------------------------
# Request Schemas
# -----------------------------------------------------------------------

class TeacherLoginRequest(BaseModel):
    email: str
    password: str

class AddStudentToSubjectSchema(BaseModel):
    email: str
    subject_id: str