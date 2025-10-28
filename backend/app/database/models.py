from __future__ import annotations

import enum
from datetime import datetime
from typing import List, Optional

from cuid import cuid
from sqlalchemy import Column, String, Enum, ForeignKey, Integer, Text, Boolean, DateTime, PrimaryKeyConstraint, UniqueConstraint
from sqlalchemy.orm import relationship, Mapped
from sqlalchemy.sql.expression import text

from app.database.core import Base


class UserRole(enum.Enum):
    admin = "admin"
    teacher = "teacher"
    student = "student"


class User(Base):
    __tablename__ = "users"

    id = Column(String, primary_key=True, default=cuid)
    name = Column(String, nullable=False)
    email = Column(String, unique=True, nullable=False)
    password_hash = Column(Text, nullable=False)
    role = Column(Enum(UserRole), nullable=False)
    roll_number = Column(String, nullable=True)
    employee_id = Column(String, nullable=True)
    created_at = Column(DateTime(timezone=True), default=datetime.utcnow, server_default=text('now()'))

    # Relationships
    certificates: Mapped[List["Certificate"]] = relationship("Certificate", back_populates="student")

    student_enrollments: Mapped[List["StudentSubjectEnrollment"]] = relationship(
        "StudentSubjectEnrollment", 
        foreign_keys="StudentSubjectEnrollment.student_id",
        back_populates="student"
    )
    teacher_allotments: Mapped[List["TeacherSubjectAllotment"]] = relationship(
        "TeacherSubjectAllotment",
        foreign_keys="TeacherSubjectAllotment.teacher_id",
        back_populates="teacher"
    )
    user_role_mappings: Mapped[Optional[List["UserRoleMapping"]]] = relationship("UserRoleMapping", back_populates="user")


class Subject(Base):
    __tablename__ = "subjects"

    id = Column(String, primary_key=True, default=cuid)
    name = Column(String, nullable=False)
    subject_code = Column(String, unique=True, nullable=False)
    nptel_course_code = Column(String, unique=False, nullable=False)

    teacher_allotments: Mapped[List["TeacherSubjectAllotment"]] = relationship("TeacherSubjectAllotment", back_populates="subject", cascade="all, delete")


class StudentSubjectEnrollment(Base):
    __tablename__ = "student_subject_enrollments"

    id = Column(String, primary_key=True, default=cuid)
    student_id = Column(String, ForeignKey("users.id"), nullable=False)
    teacher_subject_allotment_id = Column(String, ForeignKey("teacher_subject_allotments.id"), nullable=False)

    student: Mapped["User"] = relationship("User", foreign_keys=[student_id], back_populates="student_enrollments")
    teacher_subject_allotment: Mapped["TeacherSubjectAllotment"] = relationship(
        "TeacherSubjectAllotment", foreign_keys=[teacher_subject_allotment_id], back_populates="enrolled_students"
    )
    
    # One-to-one relationship with Request
    request: Mapped[Optional["Request"]] = relationship("Request", back_populates="student_subject_enrollment", uselist=False)

    __table_args__ = (
        UniqueConstraint('student_id', 'teacher_subject_allotment_id'),  # Ensure unique enrollment per student and allotment
    )


class TeacherSubjectAllotment(Base):
    __tablename__ = "teacher_subject_allotments"

    id = Column(String, primary_key=True, default=cuid)
    teacher_id = Column(String, ForeignKey("users.id"), nullable=False)
    subject_id = Column(String, ForeignKey("subjects.id"), nullable=False)
    year = Column(Integer, nullable=False)
    is_sem_odd = Column(Boolean, nullable=False)

    teacher: Mapped["User"] = relationship("User", foreign_keys=[teacher_id], back_populates="teacher_allotments")
    subject: Mapped["Subject"] = relationship("Subject", back_populates="teacher_allotments")
    enrolled_students: Mapped[Optional[List["StudentSubjectEnrollment"]]] = relationship("StudentSubjectEnrollment", back_populates="teacher_subject_allotment")

    __table_args__ = (
        # UniqueConstraint('teacher_id', 'subject_id', 'year', 'is_sem_odd'),
        UniqueConstraint('subject_id', 'year', 'is_sem_odd'),
    )


class RequestStatus(enum.Enum):
    pending = "pending"
    processing = "processing"
    completed = "completed"
    rejected = "rejected"
    error = "error"
    no_certificate = "no_certificate"
    under_review = "under_review"


class Request(Base):
    __tablename__ = "requests"

    id = Column(String, primary_key=True, default=cuid)
    student_subject_enrollment_id = Column(String, ForeignKey("student_subject_enrollments.id"), unique=True, nullable=False)

    status = Column(Enum(RequestStatus), default=RequestStatus.pending)
    created_at = Column(DateTime(timezone=True), default=datetime.utcnow, server_default=text('now()'))
    updated_at = Column(DateTime(timezone=True), default=datetime.utcnow, server_default=text('now()'), onupdate=datetime.utcnow)
    due_date = Column(DateTime(timezone=True), nullable=True)

    # One-to-one relationship with StudentSubjectEnrollment
    student_subject_enrollment: Mapped["StudentSubjectEnrollment"] = relationship("StudentSubjectEnrollment", back_populates="request")

    certificate: Mapped[Optional["Certificate"]] = relationship("Certificate", uselist=False, back_populates="request", cascade="all, delete")


class Certificate(Base):
    __tablename__ = "certificates"

    id = Column(String, primary_key=True, default=cuid)
    request_id = Column(String, ForeignKey("requests.id"), nullable=False, unique=True)
    student_id = Column(String, ForeignKey("users.id"), nullable=False)                             # Deprecated
    file_url = Column(Text, nullable=False)
    verification_file_url = Column(Text, nullable=True)
    verified_total_marks = Column(Integer, nullable=True)
    uploaded_at = Column(DateTime(timezone=True), default=datetime.utcnow, server_default=text('now()'))
    updated_at = Column(DateTime(timezone=True), default=datetime.utcnow, server_default=text('now()'), onupdate=datetime.utcnow)
    verified = Column(Boolean, default=False)
    remark = Column(String, nullable=True)

    request: Mapped["Request"] = relationship("Request", back_populates="certificate")
    student: Mapped["User"] = relationship("User", back_populates="certificates")                   # Deprecated

class Module(Base):
    __tablename__ = "modules"

    name = Column(String, primary_key=True)
    roles: Mapped[List["Role"]] = relationship("Role", back_populates="module")

class Role(Base):
    __tablename__ = "roles"

    id = Column(String, primary_key=True, default=cuid)
    module_name = Column(String, ForeignKey("modules.name"), nullable=False)
    name = Column(String, nullable=False)
    module: Mapped["Module"] = relationship("Module", back_populates="roles")
    
    users_mapped: Mapped[List["UserRoleMapping"]] = relationship("UserRoleMapping", back_populates="role_assigned")

    __table_args__ = (
        UniqueConstraint('module_name', 'name'),
    )

class UserRoleMapping(Base):
    __tablename__ = "user_role_mappings"

    user_id = Column(String, ForeignKey("users.id"), nullable=False)
    role_id = Column(String, ForeignKey("roles.id"), nullable=False)
    
    role_assigned: Mapped["Role"] = relationship("Role", foreign_keys=[role_id], back_populates="users_mapped")
    user: Mapped["User"] = relationship("User", foreign_keys=[user_id], back_populates="user_role_mappings")

    __table_args__ = (
        PrimaryKeyConstraint('user_id', 'role_id'),
    )
