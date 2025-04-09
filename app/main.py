from fastapi import FastAPI

from app.config import check_config
from app.router import router

app = FastAPI()
check_config()


app.include_router(router)