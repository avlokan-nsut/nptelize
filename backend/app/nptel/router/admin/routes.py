from fastapi import APIRouter, Depends, HTTPException, status, Query, Body

from app.database.core import get_db
from app.database.models import Role, UserRole, User, Subject, StudentSubjectEnrollment, TeacherSubjectAllotment, UserRoleMapping
from app.oauth2 import get_current_admin
from .schemas import (
    ModifyCoordinatorRequest,
    ModifyCoordinatorResponse,
    ModifyUserRoleRequest,
    ModifyUserRoleResponse,
    RoleQueryResponse,
    RolesResponse,
    StudentCreate, 
    TeacherCreate, 
    AdminCreate, 
    CreateUserResponse, 
    CreateTeacherResponse,
    SubjectCreate, 
    CreateSubjectResponse, 
    AddStudentToSubjectSchema, 
    AddTeacherToSubjectSchema

)
from app.schemas import TokenData, GenericResponse
from app.services.utils.hashing import generate_password_hash
from app.services.log_service import setup_logger

import multiprocessing

from sqlalchemy.orm import Session
from sqlalchemy import and_

from typing import List

logger = setup_logger(__name__)

router = APIRouter(prefix='/admin')

@router.get('/get/students')
def get_students(
    db: Session = Depends(get_db),
    current_admin: TokenData = Depends(get_current_admin)
):
    students = db.query(User).filter(User.role == UserRole.student).all()
    return {
        'students': [
            {
                'id': student.id,
                'name': student.name,
                'email': student.email,
                'roll_number': student.roll_number
            }
            for student in students
        ]
    }

@router.get('/get/teachers')
def get_teachers(
    db: Session = Depends(get_db),
    current_admin: TokenData = Depends(get_current_admin)
):
    teachers = db.query(User).filter(User.role == UserRole.teacher).all()
    return {
        'teachers': [
            {
                'id': teacher.id,
                'name': teacher.name,
                'email': teacher.email,
                'employee_id': teacher.employee_id
            }
            for teacher in teachers
        ]
    }

@router.get('/get/subjects')
def get_subjects(
    db: Session = Depends(get_db),
    current_admin: TokenData = Depends(get_current_admin)
):
    subjects = db.query(Subject).all()
    return {
        'subjects': [
            {
                'id': subject.id,
                'name': subject.name,
                'subject_code': subject.subject_code,
                'nptel_course_code': subject.nptel_course_code,
            }
            for subject in subjects
        ]
    }

@router.get('/get/session-subjects')
def get_session_subjects(
    year: int = Query(),
    sem: int = Query(),
    db: Session = Depends(get_db),
    current_admin: TokenData = Depends(get_current_admin)
):
    is_sem_odd = bool(sem & 1)

    allotments = db.query(TeacherSubjectAllotment).filter(
        TeacherSubjectAllotment.year == year,
        TeacherSubjectAllotment.is_sem_odd == is_sem_odd
    ).all()

    return {
        'subjects': [
            {
                'id': allotment.subject.id,
                'name': allotment.subject.name,
                'subject_code': allotment.subject.subject_code,
                'nptel_course_id': allotment.subject.nptel_course_code,
                'teacher_id': allotment.teacher_id
            }
            for allotment in allotments
        ]
    }

@router.get('/get/subject-students/{subject_id}')
def get_students_in_a_subject(
    subject_id: str,
    year: int = Query(),
    sem: int = Query(),
    db: Session = Depends(get_db),
    current_admin: TokenData = Depends(get_current_admin)
): 
    is_sem_odd = bool(sem & 1)

    student_enrollments = db.query(StudentSubjectEnrollment).filter(
        StudentSubjectEnrollment.teacher_subject_allotment.has(
            and_(
                TeacherSubjectAllotment.subject_id == subject_id,
                TeacherSubjectAllotment.year == year,
                TeacherSubjectAllotment.is_sem_odd == is_sem_odd
            )
        )
    ).all()

    return {
        'students': [
            {
                'id': enrollment.student.id,
                'name': enrollment.student.name,
                'email': enrollment.student.email,
                'roll_number': enrollment.student.roll_number
            }
            for enrollment in student_enrollments
        ]
    }

@router.get('/get/student-subjects/{student_id}')
def get_subjects_of_a_student(
    student_id: str,
    year: int = Query(),
    sem: int = Query(),
    db: Session = Depends(get_db),
    current_admin: TokenData = Depends(get_current_admin)
):
    is_sem_odd = bool(sem & 1)

    enrollments = db.query(StudentSubjectEnrollment).filter(
        StudentSubjectEnrollment.student_id == student_id,
        StudentSubjectEnrollment.teacher_subject_allotment.has(
            and_(
                TeacherSubjectAllotment.year == year,
                TeacherSubjectAllotment.is_sem_odd == is_sem_odd
            )
        )
    ).all()

    return {
        'subjects': [
            {
                'id': enrollment.teacher_subject_allotment.subject.id,
                'name': enrollment.teacher_subject_allotment.subject.name,
                'subject_code': enrollment.teacher_subject_allotment.subject.subject_code,
                'teacher_id': enrollment.teacher_subject_allotment.teacher_id
            }
            for enrollment in enrollments
        ]
    }

@router.post('/create/students', response_model=CreateUserResponse)
def create_students(
    students: List[StudentCreate], 
    current_admin: TokenData = Depends(get_current_admin), 
    db: Session = Depends(get_db)
):
    results = []
    db_students = []
    
    # TODO: Find a faster approach
    # Generate password hashes in parallel
    with multiprocessing.Pool() as pool:
        student_password_hashes = pool.map(generate_password_hash, [student.password for student in students]) 
    try:
        for i, student in enumerate(students):
            student_password_hash = student_password_hashes[i]
            db_students.append(
                User(
                    name=student.name,
                    email=student.email,
                    password_hash=student_password_hash,
                    role=UserRole.student,
                    roll_number=student.roll_number
                )
            )
        
        db.add_all(db_students)
        db.commit()
        
        # All succeeded
        return {
            'results': [
                {"email": student.email, "success": True, "message": "Student created"} 
                for student in students
            ]
        }
                
    except Exception as batch_error:
        db.rollback()
        logger.error(f"Batch processing failed: {batch_error}")
        
        # If batch fails, try individual processing to identify problematic records
        for i, student in enumerate(students):
            try:
                student_password_hash = student_password_hashes[i]
                db_student = User(
                    name=student.name,
                    email=student.email,
                    password_hash=student_password_hash,
                    role=UserRole.student,
                    roll_number=student.roll_number
                )
                
                db.add(db_student)
                db.commit()

                results.append({
                    "email": student.email,
                    "success": True,
                    "message": "Student created successfully"
                })

            except Exception: 
                db.rollback()
                results.append({
                    "email": student.email,
                    "success": False,
                    "message": "Server error",
                })
        
        return {
            'results': results
        }

@router.post('/create/teachers', response_model=CreateTeacherResponse)
def create_coordinator(
    teacher_data_list: List[TeacherCreate],  
    current_admin: TokenData = Depends(get_current_admin), 
    db: Session = Depends(get_db)
):
    results = []
    
    for teacher_data in teacher_data_list:
        try:
            teacher_password_hash = generate_password_hash(teacher_data.password)
            db_teacher = User(
                name=teacher_data.name,
                email=teacher_data.email,
                password_hash=teacher_password_hash,
                role=UserRole.teacher,
                employee_id=teacher_data.employee_id
            )
            
            db.add(db_teacher)
            db.commit()
            results.append({
                "employee_id": teacher_data.employee_id,
                "email": teacher_data.email,
                "success": True,
                "message": "Teacher created successfully"
            })
        except Exception as e:
            db.rollback()
            logger.error(f"Teacher creation error: {e}")
            results.append({
                "employee_id": teacher_data.employee_id,
                "email": teacher_data.email,
                "success": False,
                "message": "Failed to create teacher"
            })
    
    return {
        'results': results
    }


@router.post('/create/admins', response_model=GenericResponse)
def create_admins(
    admin_data: AdminCreate, 
    current_admin: TokenData = Depends(get_current_admin), 
    db: Session = Depends(get_db)
):
    # check if any admin already exists 
    existing_admin = db.query(User).filter(User.role == UserRole.admin).first()
    if existing_admin:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="An admin already exists")

    try:
        admin_password_hash = generate_password_hash(admin_data.password)
        db_admin = User(
            name=admin_data.name,
            email=admin_data.email,
            password_hash=admin_password_hash,
            role=UserRole.admin,
            employee_id=admin_data.employee_id
        )
        db.add(db_admin)
        db.commit()

        return {
            "message": "Admin created successfully"
        }
    except Exception as e:
        db.rollback()
        raise e

@router.post('/create/subjects', response_model=CreateSubjectResponse)
def create_subjects(
    subjects: List[SubjectCreate],
    current_admin: TokenData = Depends(get_current_admin),
    db: Session = Depends(get_db)
):
    results = []

    for subject in subjects:
        try:
            db_subject = Subject(
                name=subject.name,
                subject_code=subject.subject_code,
                nptel_course_code=subject.nptel_course_code,
            )

            db.add(db_subject)
            db.commit()
            results.append({
                "subject_code": subject.subject_code,
                "nptel_course_code": subject.nptel_course_code,
                "success": True,
                "message": "Subject created successfully"
            })
        except Exception as e:
            db.rollback()
            logger.error(f"Subject creation error: {e}")
            results.append({
                "subject_code": subject.subject_code,
                "nptel_course_code": subject.nptel_course_code,
                "success": False,
                "message": "Failed to create subject"
            })
    return {
        'results': results
    }

@router.post('/allot/teacher-subject')
def allot_teacher_to_subject(
    teachers_data: List[AddTeacherToSubjectSchema],
    year: int = Query(),
    sem: int = Query(),
    db: Session = Depends(get_db),
    current_admin: TokenData = Depends(get_current_admin), 
):
    is_sem_odd = bool(sem & 1)
    allotment_status = []

    for teacher in teachers_data:
        try:
            # Check if teacher exists
            db_teacher = db.query(User).filter(
                User.email == teacher.email, 
                User.role == UserRole.teacher
            ).first()
            if not db_teacher:
                allotment_status.append({
                    'email': teacher.email,
                    'success': False,
                    'message': 'Teacher not found',
                    'course_code': teacher.course_code
                })
                continue

            # Check if subject exists
            db_subject = db.query(Subject).filter(Subject.subject_code == teacher.course_code).first()
            if not db_subject:
                allotment_status.append({
                    'email': teacher.email,
                    'success': False,
                    'message': 'Subject not found',
                    'course_code': teacher.course_code,
                })
                continue
                
            db_allotment = db.query(TeacherSubjectAllotment).filter(
                TeacherSubjectAllotment.teacher_id == db_teacher.id,
                TeacherSubjectAllotment.subject_id == db_subject.id,
                TeacherSubjectAllotment.year == year,
                TeacherSubjectAllotment.is_sem_odd == is_sem_odd
            ).first()


            if db_allotment:
                allotment_status.append({
                    'email': teacher.email,
                    'success': False,
                    'message': 'Teacher already allotted to this subject',
                    'course_code': teacher.course_code
                })
                continue

            # Create the allotment
            allotment = TeacherSubjectAllotment(
                teacher_id=db_teacher.id,
                subject_id=db_subject.id,
                year=year,
                is_sem_odd=is_sem_odd
            )

            db.add(allotment)
            db.commit()

            allotment_status.append({
                'email': teacher.email,
                'success': True,
                'message': 'Teacher allotted to subject successfully',
                'course_code': teacher.course_code
            })
        except Exception as e:
            logger.error(f"Error allotting teacher to subject: {e}")
            db.rollback()
            allotment_status.append({
                'email': teacher.email,
                'success': False,
                'message': 'Unknown error while allotting teacher to subject',
                'course_code': teacher.course_code,
            })

    return {
        'results': allotment_status
    }
    
    
@router.put('/allot/teacher-subject')
def change_teacher_for_subject(
    teachers_data: List[AddTeacherToSubjectSchema],
    year: int = Query(),
    sem: int = Query(),
    db: Session = Depends(get_db),
    current_admin: TokenData = Depends(get_current_admin)
):
    is_sem_odd = bool(sem & 1)
    change_status = []

    for teacher in teachers_data:
        try:
            db_teacher = db.query(User).filter(
                User.email == teacher.email,
                User.role == UserRole.teacher
            ).first()
            if not db_teacher:
                change_status.append({
                    'email': teacher.email,
                    'success': False,
                    'message': 'Teacher not found',
                    'course_code': teacher.course_code
                })
                continue

            db_subject = db.query(Subject).filter(Subject.subject_code == teacher.course_code).first()
            if not db_subject:
                change_status.append({
                    'email': teacher.email,
                    'success': False,
                    'message': 'Subject not found',
                    'course_code': teacher.course_code,
                })
                continue

            db_allotment = db.query(TeacherSubjectAllotment).filter(
                TeacherSubjectAllotment.subject_id == db_subject.id,
                TeacherSubjectAllotment.year == year,
                TeacherSubjectAllotment.is_sem_odd == is_sem_odd
            ).first()

            if db_allotment:
                if db_allotment.teacher_id == db_teacher.id:
                    change_status.append({
                        'email': teacher.email,
                        'success': False,
                        'message': 'Teacher is already allotted to this subject',
                        'course_code': teacher.course_code
                    })
                    continue
                db_allotment.teacher_id = db_teacher.id
            else:
                db_allotment = TeacherSubjectAllotment(
                    teacher_id=db_teacher.id,
                    subject_id=db_subject.id,
                    year=year,
                    is_sem_odd=is_sem_odd
                )
                db.add(db_allotment)
            
            db.commit()

            change_status.append({
                'email': teacher.email,
                'success': True,
                'message': 'Teacher changed and allotted to subject successfully',
                'course_code': teacher.course_code
            })
        except Exception as e:
            logger.error(f"Error changing teacher allotment: {e}")
            db.rollback()
            change_status.append({
                'email': teacher.email,
                'success': False,
                'message': 'Unknown error while changing teacher for subject',
                'course_code': teacher.course_code,
            })

    return {'results': change_status}

@router.post('/enroll/students')
def enroll_students_to_subject(
    students: List[AddStudentToSubjectSchema],
    year: int = Query(),
    sem: int = Query(),
    db: Session = Depends(get_db),
    current_admin: TokenData = Depends(get_current_admin)
):
    is_sem_odd = bool(sem & 1)

    add_status = []
    for student in students:
        subject_condition = Subject.subject_code == student.course_code
        # check if student exists
        try:
            db_student = db.query(User).filter(User.email == student.email, User.role == UserRole.student).first()
            if not db_student:
                add_status.append({
                    'email': student.email,
                    'success': False,
                    'message': 'Student not found',
                    'course_code': student.course_code
                })
                continue 

            # check if subject exists
            db_subject_allotment = db.query(TeacherSubjectAllotment).filter(
                TeacherSubjectAllotment.subject.has(
                    subject_condition
                ),
                TeacherSubjectAllotment.year == year,
                TeacherSubjectAllotment.is_sem_odd == is_sem_odd
            ).first()

            if not db_subject_allotment:
                add_status.append({
                    'email': student.email,
                    'success': False,
                    'message': 'Subject not found',
                    'course_code': student.course_code,
                })
                continue

            # check if student is already enrolled in the subject
            student_subject = db.query(StudentSubjectEnrollment).filter(
                StudentSubjectEnrollment.student_id == db_student.id,
                StudentSubjectEnrollment.teacher_subject_allotment_id == db_subject_allotment.id
            ).first()

            if student_subject:
                add_status.append({
                    'email': student.email,
                    'success': False,
                    'message': 'Student already enrolled in the subject',
                    'course_code': student.course_code,
                })
                continue

            # add student to subject
            student_subject = StudentSubjectEnrollment(
                student_id=db_student.id,
                teacher_subject_allotment_id=db_subject_allotment.id
            )

            db.add(student_subject)
            db.commit()
            db.refresh(student_subject)

            add_status.append({
                'email': student.email,
                'success': True,
                'message': 'Student added to subject',
                'course_code': student.course_code,
            })

        except Exception as e:
            logger.error(f"Error adding student to subject: {e}")
            db.rollback()
            add_status.append({
                'email': student.email,
                'success': False,
                'message': 'Unknown error while adding student to subject',
                'course_code': student.course_code,
            })
            continue

    return {
        'results': add_status
    }

@router.delete('/delete/student-subject')
def delete_student_from_subject(
    student_id: str,
    subject_id: str,
    year: int = Query(),
    sem: int = Query(),
    db: Session = Depends(get_db),
    current_admin: TokenData = Depends(get_current_admin)
):
    is_sem_odd = bool(sem & 1)
    
    try:
        student_subject = db.query(StudentSubjectEnrollment).filter(
            StudentSubjectEnrollment.student_id == student_id,
            StudentSubjectEnrollment.teacher_subject_allotment.has(
                and_(
                    TeacherSubjectAllotment.subject_id == subject_id,
                    TeacherSubjectAllotment.year == year,
                    TeacherSubjectAllotment.is_sem_odd == is_sem_odd
                )
            )
        ).first()

        if not student_subject:
            raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Student not enrolled in this subject")

        db.delete(student_subject)
        db.commit()

        return {
            'message': 'Student removed from subject successfully'
        }

    except Exception as e:
        db.rollback()
        raise e
    
    
@router.get('/get/roles', response_model=RolesResponse)
def get_roles(
    db: Session = Depends(get_db),
    current_admin: TokenData = Depends(get_current_admin)
):
    builtin = [r.value for r in UserRole]
    custom_roles = db.query(Role).all()
    return {
        "builtin_roles": builtin,
        "custom_roles": [
            {
                "id": r.id,
                "module_name": r.module_name,
                "name": r.name
            } for r in custom_roles
        ]
    }


@router.get('/get/user-role', response_model=RoleQueryResponse)
def get_user_role(
    email: str = Query(..., description="Email of the user to lookup"),
    db: Session = Depends(get_db),
    current_admin: TokenData = Depends(get_current_admin)
):
    user = db.query(User).filter(User.email == email).first()
    if not user:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="User not found")

    builtin_role = user.role.value if user.role else None

    custom_roles = []
    if user.user_role_mappings:
        for mapping in user.user_role_mappings:
            role_obj = mapping.role_assigned
            if role_obj:
                custom_roles.append({
                    "id": role_obj.id,
                    "module_name": role_obj.module_name,
                    "name": role_obj.name,
                })

    return {
        "email": user.email,
        "role": builtin_role,
        "custom_roles": custom_roles,
    }

@router.put('/modify/user-role', response_model=ModifyUserRoleResponse)
def modify_user_role(
    payload: ModifyUserRoleRequest,
    db: Session = Depends(get_db),
    current_admin: TokenData = Depends(get_current_admin)
):
    requested_role_value = payload.new_role
    valid_roles = {r.value for r in UserRole}
    print(valid_roles)
    if requested_role_value not in valid_roles:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail=f"Invalid role. Valid roles: {', '.join(sorted(valid_roles))}")

    user = db.query(User).filter(User.email == payload.email).first()
    if not user:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="User not found")

    old_role = user.role.value if user.role else None
    if old_role == requested_role_value:
        return {
            "email": user.email,
            "old_role": old_role,
            "new_role": requested_role_value,
            "success": True,
            "message": "User already has the requested role"
        }

    try:
        user.role = UserRole(requested_role_value)
        db.add(user)
        db.commit()
        return {
            "email": user.email,
            "old_role": old_role,
            "new_role": requested_role_value,
            "success": True,
            "message": "User role updated successfully"
        }
    except Exception as e:
        logger.error(f"Error updating user role for {payload.email}: {e}")
        db.rollback()
        raise HTTPException(status_code=status.HTTP_500_INTERNAL_SERVER_ERROR, detail="Failed to update role")
    
    
@router.post('/modify/custom-role', response_model=ModifyCoordinatorResponse)
def modify_coordinator(
    payload: ModifyCoordinatorRequest = Body(...),
    db: Session = Depends(get_db),
    current_admin: TokenData = Depends(get_current_admin),
):
    """
    Assign or remove a module-scoped role (e.g. 'coordinator') for a user.

    Body JSON:
    {
      "email": "user@example.com",
      "module_name": "some_module",
      "role_name": "coordinator",
      "action": "add" | "remove"
    }
    """
    action = payload.action.lower()
    if action not in {"add", "remove"}:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Invalid action. Must be 'add' or 'remove'."
        )

    user = db.query(User).filter(User.email == payload.email).first()
    if not user:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="User not found")

    role = db.query(Role).filter(
        Role.module_name == payload.module_name,
        Role.name == payload.role_name
    ).first()
    if not role:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Role not found")

    existing_mapping = db.query(UserRoleMapping).filter(
        UserRoleMapping.user_id == user.id,
        UserRoleMapping.role_id == role.id
    ).first()

    try:
        if action == "add":
            if existing_mapping:
                return {
                    "email": user.email,
                    "module_name": role.module_name,
                    "role_name": role.name,
                    "action": "add",
                    "success": True,
                    "message": "User already has this role assigned"
                }

            mapping = UserRoleMapping(user_id=user.id, role_id=role.id)
            db.add(mapping)
            db.commit()
            return {
                "email": user.email,
                "module_name": role.module_name,
                "role_name": role.name,
                "action": "add",
                "success": True,
                "message": "Role assigned to user successfully"
            }

        # action == "remove"
        if not existing_mapping:
            return {
                "email": user.email,
                "module_name": role.module_name,
                "role_name": role.name,
                "action": "remove",
                "success": True,
                "message": "User did not have this role assigned"
            }

        db.delete(existing_mapping)
        db.commit()
        return {
            "email": user.email,
            "module_name": role.module_name,
            "role_name": role.name,
            "action": "remove",
            "success": True,
            "message": "Role removed from user successfully"
        }

    except Exception as e:
        logger.error(f"Error modifying coordinator role for {payload.email}: {e}")
        db.rollback()
        raise HTTPException(status_code=status.HTTP_500_INTERNAL_SERVER_ERROR, detail="Failed to modify coordinator role")