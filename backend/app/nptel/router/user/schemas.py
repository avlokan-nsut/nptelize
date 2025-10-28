from pydantic import BaseModel
from typing import List, Dict


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
    email: str
    user_id: str
    name: str
    role: str
    service_role_dict: Dict[str, List[str]]

class UserInfoResponse(BaseModel):
    user_id: str
    name: str
    email: str
    role: str
    service_role_dict: Dict[str, List[str]]