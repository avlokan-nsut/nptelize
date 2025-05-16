from pydantic import BaseModel


# -----------------------------------------------------------------------
# Request Schemas
# -----------------------------------------------------------------------

class LoginRequest(BaseModel):
    email: str
    password: str


# -----------------------------------------------------------------------
# Response Schemas
# -----------------------------------------------------------------------

class LoginResponse(BaseModel):
    message: str
    user_id: str
    name: str

class UserInfoResponse(BaseModel):
    user_id: str
    name: str
    email: str
    role: str