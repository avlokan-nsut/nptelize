from pydantic import BaseModel

from app.models import UserRole


class TokenData(BaseModel):
    user_id: str
    role: UserRole
