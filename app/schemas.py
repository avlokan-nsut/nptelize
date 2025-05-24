from pydantic import BaseModel


class TokenData(BaseModel):
    user_id: str
    role: str

class GenericResponse(BaseModel):
    message: str

class Student(BaseModel):
    pass

class Teacher(BaseModel):
    pass

class Admin(BaseModel):
    pass

class Subject(BaseModel):
    pass

class Request(BaseModel):
    pass

class Certificate(BaseModel):
    pass