from fastapi import APIRouter

user_router = APIRouter()


@user_router.get("")
def get_user():
    return {"message": "Hello World"}
