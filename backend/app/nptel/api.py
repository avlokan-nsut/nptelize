from fastapi import APIRouter

from app.nptel.router.admin.routes import router as admin_router
from app.nptel.router.student.routes import router as student_router
from app.nptel.router.teacher.routes import router as teacher_router
from app.nptel.router.user.routes import router as user_router

router = APIRouter(prefix="/nptel")

router.include_router(admin_router, tags=['admin'])
router.include_router(student_router, tags=['student'])
router.include_router(teacher_router, tags=['teacher'])
router.include_router(user_router, tags=['user'])