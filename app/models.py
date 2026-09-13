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
    event_end_date = Column(String, nullable=True)
    registration_deadline = Column(String, nullable=True)
    organizer = Column(String, nullable=True)
    event_type = Column(String, nullable=True)
    registration_url = Column(String, nullable=True)
    flyer_path = Column(String, nullable=False)
    flyer_content_type = Column(String, nullable=True)
    uploaded_by = Column(String, nullable=False)
    created_at = Column(DateTime(timezone=True), server_default=func.now())
    registrations = relationship("EventRegistration", back_populates="flyer")


class EventRegistration(Base):
    __tablename__ = "event_registrations"

    id = Column(Integer, primary_key=True, index=True)
    flyer_id = Column(Integer, ForeignKey("event_flyers.id"), nullable=False, index=True)
    student_id = Column(Integer, ForeignKey("students.id"), nullable=False, index=True)
    email = Column(String, nullable=False)
    registered_at = Column(DateTime(timezone=True), server_default=func.now(), nullable=False)
    registration_screenshot_path = Column(String, nullable=True)
    verification_status = Column(String, default="pending", nullable=False)
    verified_at = Column(DateTime(timezone=True), nullable=True)
    verified_by = Column(String, nullable=True)
    rejection_reason = Column(String, nullable=True)
    certificate_upload_path = Column(String, nullable=True)
    certificate_uploaded_at = Column(DateTime(timezone=True), nullable=True)
    reminder_sent_at = Column(DateTime(timezone=True), nullable=True)
    flyer = relationship("EventFlyer", back_populates="registrations")
    student = relationship("Student")


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
    
    # Gamification fields
    total_points = Column(Integer, default=0, index=True)      # XP points earned
    total_events = Column(Integer, default=0, index=True)      # Total events participated
    current_badge = Column(String, nullable=True)              # Current highest badge
    updated_at = Column(DateTime(timezone=True), server_default=func.now(), onupdate=func.now())

    achievements = relationship("Achievement", back_populates="student", cascade="all, delete-orphan")
    badges = relationship("StudentBadge", back_populates="student", cascade="all, delete-orphan")


class Achievement(Base):
    __tablename__ = "achievements"

    id = Column(Integer, primary_key=True, index=True)
    student_id = Column(Integer, ForeignKey("students.id"), nullable=False)

    event_name = Column(String, nullable=False, index=True)
    event_type = Column(String, nullable=True)       # Technical / Non-Technical / Sports / Cultural / Other
    prize_type = Column(String, nullable=True)        # 1st Prize / 2nd Prize / 3rd Prize / Participation
    event_date = Column(String, nullable=True)        # YYYY-MM-DD
    organizer = Column(String, nullable=True)
    college_name = Column(String, nullable=True)
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


class Badge(Base):
    """Predefined badge definitions for gamification."""
    __tablename__ = "badges"

    id = Column(Integer, primary_key=True, index=True)
    name = Column(String, unique=True, nullable=False, index=True)  # "Explorer", "Achiever", etc.
    emoji = Column(String, nullable=False)  # 🌱, 🥉, 🥈, 🥇, 💎
    description = Column(String, nullable=False)
    milestone_events = Column(Integer, nullable=False)  # Events needed to unlock (1, 3, 5, 10, 20)
    min_points = Column(Integer, nullable=False, default=0)  # Minimum points required
    unlock_message = Column(String, nullable=True)
    tier = Column(Integer, nullable=False)  # 1=Beginner, 2=Explorer, 3=Achiever, 4=Champion, 5=Elite


class StudentBadge(Base):
    """Tracks badges earned by each student."""
    __tablename__ = "student_badges"

    id = Column(Integer, primary_key=True, index=True)
    student_id = Column(Integer, ForeignKey("students.id"), nullable=False)
    badge_id = Column(Integer, ForeignKey("badges.id"), nullable=False)
    unlocked_at = Column(DateTime(timezone=True), server_default=func.now())
    is_current = Column(Boolean, default=False)  # Currently displayed badge

    student = relationship("Student", back_populates="badges")
