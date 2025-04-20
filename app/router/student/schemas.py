from pydantic import BaseModel


class StudentLoginRequest(BaseModel):
    email: str
    password: str 