import jwt
from typing import Dict
from datetime import datetime, timezone, timedelta
from fastapi import HTTPException, status, Request

from app.config import config
from app.schemas import TokenData

JWT_SECRET_KEY = config['JWT_SECRET_KEY']
ALGORITHM = config['ALGORITHM']

def create_access_token(data: Dict, expire_minutes: timedelta = timedelta(minutes=60)) -> str:
    to_encode = data.copy()
    expire_time = datetime.now(timezone.utc) + expire_minutes
    
    to_encode.update({'exp': expire_time})
    jwt_token = jwt.encode(to_encode)

    return jwt_token
    

def verify_access_token(token: str, credentials_exception: Exception) -> TokenData:
    if not token:
        raise credentials_exception
    try:
        payload = jwt.decode(token, JWT_SECRET_KEY)
        user_id = payload.user_id
        role = payload.role

        return TokenData(user_id=user_id, role=role)

    except jwt.ExpiredSignatureError:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Token has expired",
            headers={"WWW-Authenticate": "Bearer"},
        )

    except jwt.InvalidTokenError:
        raise credentials_exception
         

def get_current_user(request: Request) -> TokenData:
    credentials_exception = HTTPException(
        status_code=status.HTTP_401_UNAUTHORIZED, 
        detail="Couldn't not validate credentials",
    )

    jwt_token = request.cookie.get('access_token')
    token_data = verify_access_token(jwt_token, credentials_exception)

    return token_data



