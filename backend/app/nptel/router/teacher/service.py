from sqlalchemy import and_
from sqlalchemy.orm import Session

from typing import List, cast

from app.database.models import TeacherSubjectAllotment, Subject, Request, StudentSubjectEnrollment


def get_teacher_alloted_subjects(
    db: Session, teacher_id: str, year: int, is_sem_odd: bool, is_coordinator: bool = False
) -> List[Subject]:

    query = db.query(TeacherSubjectAllotment).filter(
        TeacherSubjectAllotment.year == year,
        TeacherSubjectAllotment.is_sem_odd == is_sem_odd,
    )
    
    if not is_coordinator:
        query = query.filter(TeacherSubjectAllotment.teacher_id == teacher_id)
    
    allotments = query.all()

    return [allotment.subject for allotment in allotments]
    

def get_student_requests_for_subject(
    db: Session, 
    teacher_id: str, 
    subject_id, 
    year: int, 
    is_sem_odd: bool, 
    is_coordinator: bool = False
) -> List[Request]:
    
    filter_conditions = [
        TeacherSubjectAllotment.year == year,
        TeacherSubjectAllotment.is_sem_odd == is_sem_odd,
        TeacherSubjectAllotment.subject_id == subject_id
    ]
    
    if not is_coordinator:
        filter_conditions.append(TeacherSubjectAllotment.teacher_id == teacher_id)
    
    enrollments = db.query(StudentSubjectEnrollment).filter(
        StudentSubjectEnrollment.request.has(),
        StudentSubjectEnrollment.teacher_subject_allotment.has(
            and_(*filter_conditions)
        )
    ).all()

    return [cast(Request, t.request) for t in enrollments]

def get_students_of_a_subject_allotment(
    db: Session, 
    teacher_id: str, 
    subject_id, 
    year: int, 
    is_sem_odd: bool, 
    is_coordinator: bool = False
) -> List[StudentSubjectEnrollment] | None:

    query = db.query(TeacherSubjectAllotment).filter(
        TeacherSubjectAllotment.year == year,
        TeacherSubjectAllotment.is_sem_odd == is_sem_odd,
        TeacherSubjectAllotment.subject_id == subject_id,
    )
    
    if not is_coordinator:
        query = query.filter(TeacherSubjectAllotment.teacher_id == teacher_id)
    
    allotment = query.first()
    
    if not allotment:
        return None
    
    return allotment.enrolled_students
