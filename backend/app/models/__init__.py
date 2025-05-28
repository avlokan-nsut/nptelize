from __future__ import annotations

import enum
from datetime import datetime
from typing import List, Optional

from cuid import cuid
from sqlalchemy import Column, String, Enum, ForeignKey, Integer, Text, Boolean, DateTime
from sqlalchemy.orm import relationship, Mapped
from sqlalchemy.sql.expression import text

from app.config.db import Base


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
    created_at = Column(DateTime, default=datetime.utcnow, server_default=text('now()'))

    # Relationships
    subjects: Mapped[List["Subject"]] = relationship("Subject", back_populates="teacher", cascade="all, delete")
    requests_sent: Mapped[List["Request"]] = relationship("Request", foreign_keys='Request.teacher_id', back_populates="teacher")
    requests_received: Mapped[List["Request"]] = relationship("Request", foreign_keys='Request.student_id', back_populates="student")
    certificates: Mapped[List["Certificate"]] = relationship("Certificate", back_populates="student")


class Subject(Base):
    __tablename__ = "subjects"

    id = Column(String, primary_key=True, default=cuid)
    name = Column(String, nullable=False)
    subject_code = Column(String, unique=True, nullable=False)
    nptel_course_code = Column(String, unique=False, nullable=False)
    teacher_id = Column(String, ForeignKey("users.id"), nullable=False)

    teacher: Mapped["User"] = relationship("User", back_populates="subjects")
    requests: Mapped[List["Request"]] = relationship("Request", back_populates="subject", cascade="all, delete")
    enrolled_students: Mapped[List["StudentSubject"]] = relationship("StudentSubject", back_populates="subject", cascade="all, delete")


class StudentSubject(Base):
    __tablename__ = "student_subjects"

    student_id = Column(String, ForeignKey("users.id"), nullable=False, primary_key=True)
    subject_id = Column(String, ForeignKey("subjects.id"), nullable=False, primary_key=True)

    subject: Mapped["Subject"] = relationship("Subject", back_populates="enrolled_students")


class RequestStatus(enum.Enum):
    pending = "pending"
    processing = "processing"
    completed = "completed"
    rejected = "rejected"
    error = "error"
    no_certificate = "no_certificate"


class Request(Base):
    __tablename__ = "requests"

    id = Column(String, unique=True, nullable=False, default=cuid)
    subject_id = Column(String, ForeignKey("subjects.id"), primary_key=True, nullable=False)
    student_id = Column(String, ForeignKey("users.id"), primary_key=True, nullable=False)
    teacher_id = Column(String, ForeignKey("users.id"), nullable=False)
    status = Column(Enum(RequestStatus), default=RequestStatus.pending)
    created_at = Column(DateTime, default=datetime.utcnow, server_default=text('now()'))
    updated_at = Column(DateTime, default=datetime.utcnow, server_default=text('now()'), onupdate=datetime.utcnow)
    due_date = Column(DateTime, nullable=True)

    subject: Mapped["Subject"] = relationship("Subject", back_populates="requests")
    teacher: Mapped["User"] = relationship("User", foreign_keys=[teacher_id], back_populates="requests_sent")
    student: Mapped["User"] = relationship("User", foreign_keys=[student_id], back_populates="requests_received")
    certificate: Mapped[Optional["Certificate"]] = relationship("Certificate", uselist=False, back_populates="request", cascade="all, delete")


class Certificate(Base):
    __tablename__ = "certificates"

    id = Column(String, primary_key=True, default=cuid)
    request_id = Column(String, ForeignKey("requests.id"), nullable=False, unique=True)
    student_id = Column(String, ForeignKey("users.id"), nullable=False)
    file_url = Column(Text, nullable=False)
    verification_file_url = Column(Text, nullable=True)
    verified_total_marks = Column(Integer, nullable=True)
    uploaded_at = Column(DateTime, default=datetime.utcnow, server_default=text('now()'))
    updated_at = Column(DateTime, default=datetime.utcnow, server_default=text('now()'), onupdate=datetime.utcnow)
    verified = Column(Boolean, default=False)
    remark = Column(String, nullable=True)

    request: Mapped["Request"] = relationship("Request", back_populates="certificate")
    student: Mapped["User"] = relationship("User", back_populates="certificates")
