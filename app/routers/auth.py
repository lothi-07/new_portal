import hashlib
import logging
import os
import secrets
import smtplib
from datetime import datetime, timedelta, timezone

from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.exc import OperationalError
from sqlalchemy.orm import Session
from sqlalchemy import func

from .. import models, schemas
from ..database import get_db
from ..auth import hash_password, verify_password, create_access_token, verify_google_token, get_current_admin
from ..email_service import send_password_reset_email

router = APIRouter(prefix="/auth", tags=["Auth"])
logger = logging.getLogger(__name__)
PASSWORD_RESET_EXPIRE_MINUTES = 30


@router.post("/signup", response_model=schemas.TokenOut)
def signup(payload: schemas.StaffCreate, db: Session = Depends(get_db)):
    """Create a staff account; administrator accounts are provisioned separately."""
    existing = db.query(models.AdminUser).filter(models.AdminUser.email == payload.email).first()
    existing = existing or db.query(models.StaffUser).filter(models.StaffUser.email == payload.email).first()
    if existing:
        raise HTTPException(status_code=400, detail="An account with this email already exists")
    user = models.StaffUser(
        email=payload.email,
        hashed_password=hash_password(payload.password),
        name=payload.name,
    )
    db.add(user)
    db.commit()
    db.refresh(user)
    token = create_access_token({"email": user.email, "type": "local", "role": "staff"})
    return {"access_token": token, "email": user.email, "name": user.name, "role": "staff"}


@router.post("/login", response_model=schemas.TokenOut)
def login(payload: schemas.AdminLogin, db: Session = Depends(get_db)):
    user = db.query(models.AdminUser).filter(models.AdminUser.email == payload.email).first()
    role = "admin"
    if not user:
        user = db.query(models.StaffUser).filter(models.StaffUser.email == payload.email).first()
        role = "staff"
    if not user or not user.is_active:
        raise HTTPException(status_code=401, detail="Incorrect email or password")
    if not verify_password(payload.password, user.hashed_password):
        raise HTTPException(status_code=401, detail="Incorrect email or password")
    if user.hashed_password and not user.hashed_password.startswith("$"):
        user.hashed_password = hash_password(payload.password)
        db.commit()
    token = create_access_token({"email": user.email, "type": "local", "role": role})
    return {"access_token": token, "email": user.email, "name": user.name, "role": role}


@router.post("/password-reset/request")
def request_password_reset(payload: schemas.PasswordResetRequest, db: Session = Depends(get_db)):
    email = str(payload.email).strip()
    user = db.query(models.AdminUser).filter(func.lower(models.AdminUser.email) == email.lower()).first()
    user = user or db.query(models.StaffUser).filter(func.lower(models.StaffUser.email) == email.lower()).first()
    if not user or not user.is_active:
        return {"message": "If an active account exists for that email, a reset link will be sent."}

    token = secrets.token_urlsafe(32)
    token_hash = hashlib.sha256(token.encode("utf-8")).hexdigest()
    expires_at = datetime.now(timezone.utc) + timedelta(minutes=PASSWORD_RESET_EXPIRE_MINUTES)
    frontend_url = os.getenv("FRONTEND_URL", "http://localhost:5173").rstrip("/")
    reset_url = f"{frontend_url}/?reset_token={token}"

    db.query(models.PasswordResetToken).filter(
        models.PasswordResetToken.email == user.email,
    ).delete(synchronize_session=False)
    reset_record = models.PasswordResetToken(
        email=user.email,
        token_hash=token_hash,
        expires_at=expires_at,
    )
    db.add(reset_record)
    db.commit()
    try:
        send_password_reset_email(user.email, reset_url, PASSWORD_RESET_EXPIRE_MINUTES)
    except (OSError, RuntimeError, ValueError, smtplib.SMTPException) as exc:
        db.rollback()
        logger.exception("Password reset email delivery failed")
        db.query(models.PasswordResetToken).filter(
            models.PasswordResetToken.token_hash == token_hash,
        ).delete(synchronize_session=False)
        db.commit()
        raise HTTPException(
            status_code=503,
            detail="The password reset email could not be sent. Please try again later or contact the portal administrator.",
        ) from exc

    return {"message": "If an active account exists for that email, a reset link will be sent."}


@router.post("/password-reset/confirm")
def confirm_password_reset(payload: schemas.PasswordResetConfirm, db: Session = Depends(get_db)):
    if len(payload.password) < 8:
        raise HTTPException(status_code=400, detail="Password must be at least 8 characters long")

    token_hash = hashlib.sha256(payload.token.encode("utf-8")).hexdigest()
    reset_record = db.query(models.PasswordResetToken).filter(
        models.PasswordResetToken.token_hash == token_hash,
        models.PasswordResetToken.used_at.is_(None),
    ).first()
    if not reset_record:
        raise HTTPException(status_code=400, detail="This password reset link is invalid or has already been used")

    expires_at = reset_record.expires_at
    if expires_at.tzinfo is None:
        expires_at = expires_at.replace(tzinfo=timezone.utc)
    if expires_at <= datetime.now(timezone.utc):
        db.delete(reset_record)
        db.commit()
        raise HTTPException(status_code=400, detail="This password reset link has expired. Request a new one.")

    user = db.query(models.AdminUser).filter(models.AdminUser.email == reset_record.email).first()
    if user is None:
        user = db.query(models.StaffUser).filter(models.StaffUser.email == reset_record.email).first()
    if not user or not user.is_active:
        db.delete(reset_record)
        db.commit()
        raise HTTPException(status_code=400, detail="This password reset link is no longer valid")

    now = datetime.now(timezone.utc)
    consumed = db.query(models.PasswordResetToken).filter(
        models.PasswordResetToken.id == reset_record.id,
        models.PasswordResetToken.used_at.is_(None),
    ).update({"used_at": now}, synchronize_session=False)
    if consumed != 1:
        db.rollback()
        raise HTTPException(status_code=400, detail="This password reset link is invalid or has already been used")

    user.hashed_password = hash_password(payload.password)
    db.query(models.PasswordResetToken).filter(
        models.PasswordResetToken.email == reset_record.email,
        models.PasswordResetToken.id != reset_record.id,
    ).delete(synchronize_session=False)
    db.commit()
    return {"message": "Password reset successfully. You can now sign in with your new password."}


@router.post("/google", response_model=schemas.TokenOut)
def google_login(body: dict, db: Session = Depends(get_db)):
    """Frontend sends { credential: '<google id token>' }."""
    credential = body.get("credential")
    if not credential:
        raise HTTPException(status_code=400, detail="Missing 'credential'")
    info = verify_google_token(credential)
    email = info.get("email")
    name = info.get("name")
    user = db.query(models.AdminUser).filter(models.AdminUser.email == email, models.AdminUser.is_active.is_(True)).first()
    role = "admin"
    if not user:
        user = db.query(models.StaffUser).filter(models.StaffUser.email == email, models.StaffUser.is_active.is_(True)).first()
        role = "staff"
    if not user:
        raise HTTPException(status_code=403, detail="Create a staff account before using Google sign-in")
    token = create_access_token({"email": email, "type": "google", "role": role})
    return {"access_token": token, "email": email, "name": user.name or name, "role": role}

@router.post("/student-login")
def student_login(body: dict, db: Session = Depends(get_db)):
    """Students log in with Roll Number + Mobile Number (no password needed)."""
    roll_no = str(body.get("roll_no", "")).strip().upper()
    mobile_input = str(body.get("mobile", "")).strip()

    try:
        student = db.query(models.Student).filter(models.Student.roll_no == roll_no).first()
    except OperationalError:
        raise HTTPException(
            status_code=503,
            detail="Student login is temporarily unavailable because the database cannot be reached",
        )
    if not student or not student.mobile_number:
        raise HTTPException(status_code=401, detail="Roll number or mobile number is incorrect")

    # compare digits only, in case of spaces/dashes/leading zeros differences
    stored = "".join(filter(str.isdigit, student.mobile_number))
    typed = "".join(filter(str.isdigit, mobile_input))

    if stored[-10:] != typed[-10:]:  # compare last 10 digits (ignores country code differences)
        raise HTTPException(status_code=401, detail="Roll number or mobile number is incorrect")

    token = create_access_token({"student_id": student.id, "email": student.email or student.roll_no, "role": "student"})
    return {
        "access_token": token,
        "student_id": student.id,
        "roll_no": student.roll_no,
        "first_name": student.first_name,
        "last_name": student.last_name,
        "name": f"{student.first_name} {student.last_name or ''}".strip(),
        "email": student.email,
        "section": student.section,
        "year": student.year,
        "department": student.department,
        "mobile_number": student.mobile_number,
        "mentor_id": student.mentor_id,
        "mentor_name": student.mentor.name if student.mentor else None,
        "mentor_email": student.mentor.email if student.mentor else None,
        "role": "student",
    }

@router.post("/staff", response_model=schemas.TokenOut)
def create_staff_account(
    payload: schemas.StaffCreate,
    db: Session = Depends(get_db),
    admin: str = Depends(get_current_admin),
):
    if db.query(models.AdminUser).filter(models.AdminUser.email == payload.email).first() or \
       db.query(models.StaffUser).filter(models.StaffUser.email == payload.email).first():
        raise HTTPException(status_code=400, detail="An account with this email already exists")
    user = models.StaffUser(email=payload.email, hashed_password=hash_password(payload.password), name=payload.name)
    db.add(user)
    db.commit()
    db.refresh(user)
    # The created staff account must sign in separately; this token is not used by the admin UI.
    token = create_access_token({"email": user.email, "type": "local", "role": "staff"})
    return {"access_token": token, "email": user.email, "name": user.name, "role": "staff"}


@router.get("/staff")
def list_staff_accounts(
    db: Session = Depends(get_db),
    admin: str = Depends(get_current_admin),
):
    return [
        {
            "id": user.id,
            "name": user.name or "Unnamed staff",
            "email": user.email,
            "is_active": user.is_active,
        }
        for user in db.query(models.StaffUser).order_by(models.StaffUser.name, models.StaffUser.email).all()
    ]
