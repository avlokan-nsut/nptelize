from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

from app.config import check_config, config
from app.router import router

app = FastAPI(
    title="NPTEL Automation API",
    version="1.0.0",
)

check_config()

local_ports = ['3000', '5173', '8000', '8080']

origins = (
    ['http://localhost:' + port for port in local_ports] 
    if config['ENV'] == 'DEVELOPMENT' else [config['FRONTEND_URL']]
)

print(origins)

app.add_middleware(
    CORSMiddleware,
    allow_origins=origins,
    allow_credentials=True,
    allow_methods=["*"],
)

app.include_router(router, prefix="/api")
