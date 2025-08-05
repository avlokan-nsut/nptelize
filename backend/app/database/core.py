from typing import Generator, AsyncGenerator

from sqlalchemy import create_engine
from sqlalchemy.orm import sessionmaker, declarative_base, Session
from sqlalchemy.ext.asyncio import create_async_engine, AsyncSession, async_sessionmaker

from app.config import config

engine = create_engine(config['DB_URI'])
SessionLocal = sessionmaker(bind=engine, autoflush=False, autocommit=False)

async_engine = create_async_engine(config['ASYNC_DB_URI'])
AsyncSessionLocal = async_sessionmaker(
    bind=async_engine, 
    class_=AsyncSession,
    autoflush=False, 
    autocommit=False,
)

Base = declarative_base()


def get_db() -> Generator[Session, None, None]:
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()

async def get_async_db() -> AsyncGenerator[AsyncSession, None]:
   async with AsyncSessionLocal() as db:
       try:
           yield db
       finally:
           await db.close() 