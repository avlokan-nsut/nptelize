from contextlib import asynccontextmanager

from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

import logging

from typing import AsyncGenerator

from app.config import check_config, config
from app.database.core import AsyncSessionLocal
from app.nptel.api import router
from app.services.cleanup import CleanupService


logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

@asynccontextmanager
async def lifespan(app: FastAPI) -> AsyncGenerator[None, None]:
    logger.info("Starting up FastAPI application")

    cleanup_service = CleanupService(AsyncSessionLocal)
    cleanup_service.start_periodic_cleanup()

    yield

    logger.info("Shutting down FastAPI application")
    cleanup_service.stop_periodic_cleanup()
    await cleanup_service.execute_cleanup()

app = FastAPI(
    title="NPTEL Automation API",
    version="1.0.0",
    # lifespan=lifespan
)

check_config()

local_ports = ['3000', '5173', '8000', '8080']

origins = (
    ['http://localhost:' + port for port in local_ports] 
    if config['ENV'] == 'DEVELOPMENT' else [config['FRONTEND_URL']]
)

app.add_middleware(
    CORSMiddleware,
    allow_origins=origins,
    allow_credentials=True,
    allow_methods=["*"],
)

app.include_router(router, prefix="/api")
