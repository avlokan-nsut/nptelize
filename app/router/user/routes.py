from fastapi import APIRouter


router = APIRouter(prefix='/user')

@router.post('/login')
def login_user():
    pass
