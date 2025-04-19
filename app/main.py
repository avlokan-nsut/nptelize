from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

from app import models
from app.config import check_config
from app.config.db import engine
from app.router import router

models.Base.metadata.create_all(bind=engine)
app = FastAPI(
    title="NPTEL Automation API",
    version="1.0.0",
)
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
