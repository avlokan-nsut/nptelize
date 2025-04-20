from pydantic import BaseModel


class TeacherLoginRequest(BaseModel):
    email: str
    password: str