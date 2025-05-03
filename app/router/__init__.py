from fastapi import APIRouter

from app.router.admin.routes import router as admin_router
from app.router.student.routes import router as student_router
from app.router.subject.routes import router as subject_router
from app.router.teacher.routes import router as teacher_router

router = APIRouter()

router.include_router(admin_router, tags=["admin"])
router.include_router(student_router, tags=['student'])
router.include_router(subject_router, tags=['subject'])
router.include_router(teacher_router, tags=['teacher'])
