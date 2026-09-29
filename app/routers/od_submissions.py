import os
from datetime import datetime, timezone
from pathlib import Path
from uuid import uuid4

from fastapi import APIRouter, Depends, File, Form, HTTPException, UploadFile
from sqlalchemy.orm import Session, joinedload

from .. import models
from ..auth import get_current_staff_or_admin, get_current_student
from ..database import get_db

router = APIRouter(prefix="/od-submissions", tags=["OD Submissions"])
OD_DIR = Path(__file__).resolve().parent.parent / "static" / "od-documents"
ALLOWED_TYPES = {"image/jpeg", "image/png", "image/webp", "application/pdf"}


def _save_document(upload: UploadFile) -> str:
    if upload.content_type not in ALLOWED_TYPES:
        raise HTTPException(status_code=400, detail="Upload a JPG, PNG, WEBP, or PDF document")
    extension = os.path.splitext(upload.filename or "")[1].lower()
    if extension not in {".jpg", ".jpeg", ".png", ".webp", ".pdf"}:
        raise HTTPException(status_code=400, detail="Unsupported OD document file extension")
    contents = upload.file.read()
    if len(contents) > 10 * 1024 * 1024:
        raise HTTPException(status_code=400, detail="OD document must be 10 MB or smaller")
    OD_DIR.mkdir(parents=True, exist_ok=True)
    filename = f"{uuid4().hex}{extension}"
    (OD_DIR / filename).write_bytes(contents)
    return f"/static/od-documents/{filename}"


def _json(item: models.ODSubmission) -> dict:
    return {
        "id": item.id,
        "student_id": item.student_id,
        "student_name": item.student_name,
        "register_number": item.register_number,
        "department": item.department,
        "year_section": item.year_section,
        "od_date": item.od_date,
        "total_days": item.total_days,
        "student_mobile": item.student_mobile,
        "parent_mobile": item.parent_mobile,
        "purpose": item.purpose,
        "document_path": item.document_path,
        "status": item.status,
        "rejection_reason": item.rejection_reason,
        "reviewed_at": item.reviewed_at,
        "reviewed_by": item.reviewed_by,
        "submitted_at": item.submitted_at,
    }


@router.post("/", status_code=201)
def create_od_submission(
    register_number: str = Form(...),
    department: str | None = Form(None),
    year_section: str | None = Form(None),
    od_date: str = Form(...),
    total_days: int = Form(...),
    student_mobile: str | None = Form(None),
    parent_mobile: str | None = Form(None),
    purpose: str = Form(...),
    document: UploadFile | None = File(None),
    db: Session = Depends(get_db),
    user: dict = Depends(get_current_student),
):
    student = db.query(models.Student).filter(models.Student.id == user["student_id"]).first()
    if not student:
        raise HTTPException(status_code=404, detail="Student not found")
    if total_days < 1:
        raise HTTPException(status_code=400, detail="Total number of days must be at least 1")
    try:
        datetime.strptime(od_date, "%Y-%m-%d")
    except ValueError as exc:
        raise HTTPException(status_code=400, detail="OD date must be in YYYY-MM-DD format") from exc
    if not purpose.strip() or not register_number.strip():
        raise HTTPException(status_code=400, detail="Register number and purpose are required")

    item = models.ODSubmission(
        student_id=student.id,
        student_name=f"{student.first_name} {student.last_name or ''}".strip(),
        register_number=register_number.strip(),
        department=(department or student.department or "").strip(),
        year_section=(year_section or f"{student.year or ''} {student.section or ''}").strip(),
        od_date=od_date,
        total_days=total_days,
        student_mobile=(student_mobile or student.mobile_number or "").strip(),
        parent_mobile=(parent_mobile or "").strip(),
        purpose=purpose.strip(),
        document_path=_save_document(document) if document else None,
    )
    db.add(item)
    db.commit()
    db.refresh(item)
    return _json(item)


@router.get("/mine")
def list_my_od_submissions(
    db: Session = Depends(get_db),
    user: dict = Depends(get_current_student),
):
    items = db.query(models.ODSubmission).filter(
        models.ODSubmission.student_id == user["student_id"]
    ).order_by(models.ODSubmission.submitted_at.desc()).all()
    return [_json(item) for item in items]


@router.get("/")
def list_od_submissions(
    db: Session = Depends(get_db),
    user: dict = Depends(get_current_staff_or_admin),
):
    items = db.query(models.ODSubmission).options(
        joinedload(models.ODSubmission.student)
    ).order_by(models.ODSubmission.submitted_at.desc()).all()
    return [_json(item) for item in items]


@router.post("/{submission_id}/review")
def review_od_submission(
    submission_id: int,
    approved: bool = Form(...),
    rejection_reason: str | None = Form(None),
    db: Session = Depends(get_db),
    user: dict = Depends(get_current_staff_or_admin),
):
    item = db.query(models.ODSubmission).filter(models.ODSubmission.id == submission_id).first()
    if not item:
        raise HTTPException(status_code=404, detail="OD submission not found")
    item.status = "approved" if approved else "rejected"
    item.rejection_reason = None if approved else (rejection_reason or "OD request was rejected")
    item.reviewed_at = datetime.now(timezone.utc)
    item.reviewed_by = user["email"]
    db.commit()
    db.refresh(item)
    return _json(item)
