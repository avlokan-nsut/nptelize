from pydantic import BaseModel, Field


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

class ChangePasswordRequest(BaseModel):
    current_password: str = Field(..., min_length=1, description="Current password")
    new_password: str = Field(..., min_length=6, description="New password (minimum 6 characters)")