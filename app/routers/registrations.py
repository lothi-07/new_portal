from datetime import datetime, timedelta, timezone

import os
from datetime import datetime, timedelta, timezone
from pathlib import Path
from uuid import uuid4

from fastapi import APIRouter, Depends, File, Form, HTTPException, UploadFile
from sqlalchemy.orm import Session, joinedload

from .. import models
from ..auth import get_current_admin, get_current_staff_or_admin, get_current_student
from ..database import get_db

router = APIRouter(prefix="/registrations", tags=["Registrations"])
UPLOAD_DIR = Path(__file__).resolve().parent.parent / "static" / "registration-screenshots"
ALLOWED_TYPES = {"image/jpeg", "image/png", "image/webp", "application/pdf"}


@router.post("/{flyer_id}", status_code=201)
def register_for_event(
    flyer_id: int,
    db: Session = Depends(get_db),
    user: dict = Depends(get_current_student),
    screenshot: UploadFile | None = File(None),
):
    student_id = user.get("student_id")
    flyer = db.query(models.EventFlyer).filter(models.EventFlyer.id == flyer_id).first()
    student = db.query(models.Student).filter(models.Student.id == student_id).first()
    if not flyer or not student:
        raise HTTPException(status_code=404, detail="Event or student not found")
    existing = db.query(models.EventRegistration).filter(
        models.EventRegistration.flyer_id == flyer_id,
        models.EventRegistration.student_id == student_id,
    ).first()
    if existing:
        if screenshot and not existing.registration_screenshot_path:
            existing.registration_screenshot_path = _save_upload(screenshot)
            db.commit()
        return {"id": existing.id, "message": "Registration already recorded", "status": existing.verification_status}
    if not student.email:
        raise HTTPException(status_code=400, detail="Add an email address to your student profile first")
    registration = models.EventRegistration(
        flyer_id=flyer_id, student_id=student_id, email=student.email
    )
    if screenshot:
        registration.registration_screenshot_path = _save_upload(screenshot)
    db.add(registration)
    db.commit()
    db.refresh(registration)
    return {"id": registration.id, "message": "Registration recorded"}


def _save_upload(upload: UploadFile) -> str:
    if upload.content_type not in ALLOWED_TYPES:
        raise HTTPException(status_code=400, detail="Upload a JPG, PNG, WEBP, or PDF screenshot")
    extension = os.path.splitext(upload.filename or "")[1].lower() or ".jpg"
    if extension not in {".jpg", ".jpeg", ".png", ".webp", ".pdf"}:
        raise HTTPException(status_code=400, detail="Unsupported screenshot file extension")
    contents = upload.file.read()
    if len(contents) > 10 * 1024 * 1024:
        raise HTTPException(status_code=400, detail="Screenshot must be 10 MB or smaller")
    UPLOAD_DIR.mkdir(parents=True, exist_ok=True)
    filename = f"{uuid4().hex}{extension}"
    (UPLOAD_DIR / filename).write_bytes(contents)
    return f"/static/registration-screenshots/{filename}"


@router.get("/mine")
def list_my_registrations(
    db: Session = Depends(get_db),
    user: dict = Depends(get_current_student),
):
    registrations = db.query(models.EventRegistration).options(
        joinedload(models.EventRegistration.flyer)
    ).filter(models.EventRegistration.student_id == user["student_id"]).order_by(
        models.EventRegistration.registered_at.desc()
    ).all()
    return [_registration_json(item) for item in registrations]


@router.get("/")
def list_registrations(
    status: str | None = None,
    db: Session = Depends(get_db),
    user: dict = Depends(get_current_staff_or_admin),
):
    query = db.query(models.EventRegistration).options(
        joinedload(models.EventRegistration.flyer),
        joinedload(models.EventRegistration.student),
    )
    if status:
        query = query.filter(models.EventRegistration.verification_status == status)
    return [_registration_json(item, include_student=True) for item in query.order_by(
        models.EventRegistration.registered_at.desc()
    ).all()]


@router.post("/{registration_id}/verify")
def verify_registration(
    registration_id: int,
    approved: bool = Form(...),
    rejection_reason: str | None = Form(None),
    db: Session = Depends(get_db),
    user: dict = Depends(get_current_staff_or_admin),
):
    registration = db.query(models.EventRegistration).filter(
        models.EventRegistration.id == registration_id
    ).first()
    if not registration:
        raise HTTPException(status_code=404, detail="Registration not found")
    registration.verification_status = "approved" if approved else "rejected"
    registration.verified_at = datetime.now(timezone.utc)
    registration.verified_by = user["email"]
    registration.rejection_reason = None if approved else (rejection_reason or "Screenshot was not approved")
    db.commit()
    return {"message": f"Registration {registration.verification_status}", "status": registration.verification_status}


def _registration_json(registration: models.EventRegistration, include_student: bool = False) -> dict:
    result = {
        "id": registration.id,
        "flyer_id": registration.flyer_id,
        "event_title": registration.flyer.title if registration.flyer else None,
        "event_date": registration.flyer.event_date if registration.flyer else None,
        "event_end_date": registration.flyer.event_end_date if registration.flyer else None,
        "email": registration.email,
        "registered_at": registration.registered_at,
        "registration_screenshot_path": registration.registration_screenshot_path,
        "verification_status": registration.verification_status,
        "rejection_reason": registration.rejection_reason,
        "certificate_upload_path": registration.certificate_upload_path,
        "certificate_uploaded_at": registration.certificate_uploaded_at,
    }
    if include_student and registration.student:
        result.update({
            "student_id": registration.student.id,
            "student_name": f"{registration.student.first_name} {registration.student.last_name or ''}".strip(),
            "roll_no": registration.student.roll_no,
        })
    return result


def send_due_certificate_reminders(db: Session) -> dict:
    today = datetime.now(timezone.utc).date()
    due = db.query(models.EventRegistration).options(
        joinedload(models.EventRegistration.flyer),
        joinedload(models.EventRegistration.student),
    ).filter(
        models.EventRegistration.reminder_sent_at.is_(None),
        models.EventRegistration.verification_status == "approved",
        models.EventRegistration.certificate_uploaded_at.is_(None),
    ).all()
    due = [
        item for item in due
        if item.flyer and item.flyer.event_end_date
        and _parse_date(item.flyer.event_end_date) + timedelta(days=4) <= today
    ]
    sent = 0
    failures = []
    for registration in due:
        try:
            from ..email_service import send_certificate_deadline_reminder
            send_certificate_deadline_reminder(
                registration.email,
                f"{registration.student.first_name} {registration.student.last_name or ''}".strip(),
                registration.flyer.title,
            )
            registration.reminder_sent_at = datetime.now(timezone.utc)
            sent += 1
        except Exception as exc:
            failures.append({"registration_id": registration.id, "reason": str(exc)})
    db.commit()
    return {"due": len(due), "sent": sent, "failures": failures}


def _parse_date(value: str):
    try:
        return datetime.strptime(value, "%Y-%m-%d").date()
    except ValueError as exc:
        raise ValueError(f"Invalid event end date: {value}") from exc
