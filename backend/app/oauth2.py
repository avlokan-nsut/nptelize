from datetime import datetime, timezone, timedelta
from typing import Dict, List, Callable

import jwt
from fastapi import HTTPException, status, Request

from app.config import config
from app.schemas import TokenData
from app.database.models import UserRole

JWT_SECRET_KEY = config['JWT_SECRET_KEY']
ALGORITHM = config['ALGORITHM']
ACCESS_TOKEN_EXPIRE_MINUTES = config['ACCESS_TOKEN_EXPIRE_MINUTES']

def create_access_token(data: Dict, expire_minutes: timedelta = timedelta(int(ACCESS_TOKEN_EXPIRE_MINUTES))) -> str:
    to_encode = data.copy()
    expire_time = datetime.now(timezone.utc) + expire_minutes

    to_encode.update({'exp': expire_time})
    jwt_token = jwt.encode(to_encode, JWT_SECRET_KEY, algorithm=ALGORITHM)

    return jwt_token


def verify_access_token(token: str, credentials_exception: Exception) -> TokenData:
    if not token:
        raise credentials_exception
    try:
        payload = jwt.decode(token, JWT_SECRET_KEY, [ALGORITHM])
        user_id = payload['user_id']
        role = payload['role']
        service_role_dict = payload['service_role_dict']

        return TokenData(user_id=user_id, role=role, service_role_dict=service_role_dict)

    except jwt.ExpiredSignatureError:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Token has expired",
            headers={"WWW-Authenticate": "Bearer"},
        )

    except jwt.InvalidTokenError:
        raise credentials_exception


def get_current_user(request: Request, role: UserRole) -> TokenData:
    credentials_exception = HTTPException(
        status_code=status.HTTP_401_UNAUTHORIZED,
        detail="Couldn't not validate credentials",
    )

    jwt_token = request.cookies.get('access_token')
    token_data = verify_access_token(jwt_token, credentials_exception)

    if not token_data.role == role.value:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Invalid role"
        )

    return token_data

def get_current_student(request: Request) -> TokenData:
    return get_current_user(request, UserRole.student)

def get_current_teacher(request: Request) -> TokenData:
    return get_current_user(request, UserRole.teacher)

def get_current_admin(request: Request) -> TokenData:
    return get_current_user(request, UserRole.admin)

def get_current_user_role_agnostic(request: Request) -> TokenData:
    credentials_exception = HTTPException(
        status_code=status.HTTP_401_UNAUTHORIZED,
        detail="Couldn't not validate credentials",
    )

    jwt_token = request.cookies.get('access_token')
    token_data = verify_access_token(jwt_token, credentials_exception)

    return token_data

def role_based_access_generic(service_name: str) -> Callable[[List[str]], Callable[[Request], TokenData]]:
    
    def role_based_access(role_names: List[str]) -> Callable[[Request], TokenData]:
        
        def get_current_access(request: Request) -> TokenData:
            credentials_exception = HTTPException(
                status_code=status.HTTP_401_UNAUTHORIZED,
                detail="Couldn't not validate credentials",
            )

            jwt_token = request.cookies.get('access_token')
            token_data = verify_access_token(jwt_token, credentials_exception)

            service_role_dict = token_data.service_role_dict

            if service_name not in service_role_dict:
                raise HTTPException(
                    status_code=status.HTTP_401_UNAUTHORIZED, 
                    detail="You are not authorized to access this resource."
                )
                
            current_service_roles = service_role_dict[service_name]

            if set(role_names) and set(current_service_roles):
                return token_data
            
            raise HTTPException(
                status_code=status.HTTP_401_UNAUTHORIZED, 
                detail="You are not authorized to access this resource."
            )
            
        return get_current_access
    
    return role_based_access