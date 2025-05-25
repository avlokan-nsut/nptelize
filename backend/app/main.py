from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from fastapi.staticfiles import StaticFiles
from fastapi.responses import FileResponse

import os

from app.config import check_config, config
from app.router import router

app = FastAPI(
    title="NPTEL Automation API",
    version="1.0.0",
)

class SPAStaticFiles(StaticFiles):
    async def get_response(self, path: str, scope):             # type: ignore
        try:
            return await super().get_response(path, scope)
        except Exception:
            # If file not found, serve index.html (for SPA routing)
            return FileResponse(os.path.join(self.directory, "index.html"))

check_config()

local_ports = ['3000', '5173', '8000', '8080']

origins = ['http://localhost:' + port for port in local_ports] if config['ENV'] == 'DEVELOPMENT' else config['FRONTEND_URL']

print(origins)

app.add_middleware(
    CORSMiddleware,
    allow_origins=origins,
    allow_credentials=True,
    allow_methods=["*"],
)

app.include_router(router, prefix="/api")
app.mount("/", SPAStaticFiles(directory="dist", html=True), name="static")
