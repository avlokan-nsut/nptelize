import asyncio

from datetime import datetime, timezone, timedelta

import logging

from sqlalchemy.ext.asyncio import AsyncSession, async_sessionmaker
from sqlalchemy import select
from sqlalchemy.orm import joinedload

from typing import Sequence

from app.models import Request, RequestStatus, Certificate

logger = logging.getLogger(__name__)

class CleanupService:
    def __init__(self, session_factory: async_sessionmaker[AsyncSession]):
        self.session_factory = session_factory
        self.running = False
        self.periodic_cleanup_task: asyncio.Task | None = None
    
    def start_periodic_cleanup(self) -> None:
        if not self.running:
            self.running = True
            self.periodic_cleanup_task = asyncio.create_task(self.periodic_cleanup())     
            logger.info("Background cleanup service started")
    
    def stop_periodic_cleanup(self) -> None:
        self.running = False
        if self.periodic_cleanup_task:
            self.periodic_cleanup_task.cancel()
            self.periodic_cleanup_task = None
            logger.info("Background cleanup service stopped")
        
    async def periodic_cleanup(self) -> None:
        while self.running:
            try:
                await self.execute_cleanup() 
                await asyncio.sleep(60 * 60)
            except Exception as e:
                logger.error(f"Error during cleanup: {e}")
                
    
    async def execute_cleanup(self) -> None:
        async with self.session_factory() as db:
            stale_certificates = await self.get_stale_processing_certificates(db)
            for certificate in stale_certificates:
                await self.update_request_and_certificate(certificate, db)
            
    
    async def get_stale_processing_certificates(self, db: AsyncSession) -> Sequence[Certificate]:
        one_hour_before = datetime.now(timezone.utc) - timedelta(hours=1)
        stmt = (
            select(Certificate)
            .join(Certificate.request)
            .options(joinedload(Certificate.request))
            .where(
                Request.status == RequestStatus.processing,
                Request.updated_at < one_hour_before
            )
        )
        result = await db.execute(stmt)
        return result.scalars().all()
    
    
    async def update_request_and_certificate(self, certificate: Certificate, db: AsyncSession) -> None:
        request = certificate.request
        request.status = RequestStatus.pending
        certificate.remark = "Previously stuck at processing"
        await db.commit()