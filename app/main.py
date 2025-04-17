from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

from app.config import check_config
from app.router import router

app = FastAPI()
check_config()

origins = [
    "http://localhost:5173",
]

app.add_middleware(
    CORSMiddleware,
    allow_origins=origins,
    allow_credentials=True,
    allow_methods=["*"],
)

app.include_router(router, prefix="/api")
