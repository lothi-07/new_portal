from sqlalchemy import Column, Integer, String, ForeignKey, DateTime, Boolean
from sqlalchemy.orm import relationship
from sqlalchemy.sql import func
from .database import Base


class AdminUser(Base):
    """Normal login (email + password) admin accounts."""
    __tablename__ = "admin_users"

    id = Column(Integer, primary_key=True, index=True)
    email = Column(String, unique=True, index=True, nullable=False)
    hashed_password = Column(String, nullable=False)
    name = Column(String, nullable=True)
    is_active = Column(Boolean, default=True)


class StaffUser(Base):
    __tablename__ = "staff_users"

    id = Column(Integer, primary_key=True, index=True)
    email = Column(String, unique=True, index=True, nullable=False)
    hashed_password = Column(String, nullable=False)
    name = Column(String, nullable=True)
    is_active = Column(Boolean, default=True)


class EventFlyer(Base):
    __tablename__ = "event_flyers"

    id = Column(Integer, primary_key=True, index=True)
    title = Column(String, nullable=False)
    description = Column(String, nullable=True)
    event_date = Column(String, nullable=True)
    registration_deadline = Column(String, nullable=True)
    organizer = Column(String, nullable=True)
    flyer_path = Column(String, nullable=False)
    flyer_content_type = Column(String, nullable=True)
    uploaded_by = Column(String, nullable=False)
    created_at = Column(DateTime(timezone=True), server_default=func.now())


class Student(Base):
    __tablename__ = "students"

    id = Column(Integer, primary_key=True, index=True)
    roll_no = Column(String, index=True, nullable=False)
    reg_no = Column(String, nullable=True)
    first_name = Column(String, nullable=False)
    last_name = Column(String, nullable=True)
    gender = Column(String, nullable=True)
    dob = Column(String, nullable=True)
    blood_group = Column(String, nullable=True)
    mobile_number = Column(String, nullable=True)
    email = Column(String, nullable=True)
    year = Column(String, default="I", index=True)          # I / II / III / IV
    department = Column(String, default="AI & DS", index=True)
    section = Column(String, nullable=False, index=True)     # A / B / C
    photo_path = Column(String, nullable=True)

    achievements = relationship("Achievement", back_populates="student", cascade="all, delete-orphan")


class Achievement(Base):
    __tablename__ = "achievements"

    id = Column(Integer, primary_key=True, index=True)
    student_id = Column(Integer, ForeignKey("students.id"), nullable=False)

    event_name = Column(String, nullable=False, index=True)
    event_type = Column(String, nullable=True)       # Technical / Non-Technical / Sports / Cultural / Other
    prize_type = Column(String, nullable=True)        # 1st Prize / 2nd Prize / 3rd Prize / Participation
    event_date = Column(String, nullable=True)        # YYYY-MM-DD
    organizer = Column(String, nullable=True)
    source = Column(String, default="manual")          # "manual" or "certificate_upload"
    certificate_upload_path = Column(String, nullable=True)  # raw uploaded certificate photo, if any
    output_type = Column(String, nullable=True)        # poster / certificate
    output_path = Column(String, nullable=True)
    created_at = Column(DateTime(timezone=True), server_default=func.now())

    student = relationship("Student", back_populates="achievements")


class EventTarget(Base):
    """Staff-assigned event targets with deadlines."""
    __tablename__ = "event_targets"

    id = Column(Integer, primary_key=True, index=True)
    event_name = Column(String, nullable=False)
    description = Column(String, nullable=True)
    deadline = Column(String, nullable=False)  # YYYY-MM-DD
    target_year = Column(String, nullable=True)
    target_section = Column(String, nullable=True)
    target_dept = Column(String, nullable=True)
    notify_sent = Column(Boolean, default=False)
    created_at = Column(DateTime(timezone=True), server_default=func.now())


class ProgramVoucher(Base):
    """Event announcements / program flyers uploaded by staff."""
    __tablename__ = "program_vouchers"

    id = Column(Integer, primary_key=True, index=True)
    event_name = Column(String, nullable=False)
    event_date = Column(String, nullable=True)
    college_name = Column(String, nullable=True)
    description = Column(String, nullable=True)
    file_path = Column(String, nullable=True)  # Path to the uploaded voucher image/pdf
    uploaded_by = Column(String, nullable=True)
    created_at = Column(DateTime(timezone=True), server_default=func.now())
