import os
import logging
from datetime import date, datetime
from pathlib import Path
from urllib.parse import urlparse
from uuid import uuid4

from fastapi import APIRouter, Depends, File, Form, HTTPException, UploadFile
from sqlalchemy.orm import Session

from .. import models
from ..auth import get_current_staff_or_admin
from ..database import get_db

router = APIRouter(prefix="/event-flyers", tags=["Event Flyers"])
FLYER_DIR = Path(__file__).resolve().parent.parent / "static" / "event-flyers"
ALLOWED_TYPES = {"image/jpeg", "image/png", "image/webp", "application/pdf"}
logger = logging.getLogger(__name__)


def _delete_flyer_and_registrations(db: Session, flyer: models.EventFlyer) -> list[Path]:
    related_registrations = db.query(models.EventRegistration).filter(
        models.EventRegistration.flyer_id == flyer.id
    ).all()
    paths_to_remove = []
    if flyer.flyer_path:
        paths_to_remove.append(FLYER_DIR / Path(flyer.flyer_path).name)
    for registration in related_registrations:
        if registration.registration_screenshot_path:
            paths_to_remove.append(
                FLYER_DIR.parent / "registration-screenshots" / Path(registration.registration_screenshot_path).name
            )
        db.delete(registration)
    db.delete(flyer)
    return paths_to_remove


def _remove_files(paths: list[Path]) -> None:
    for path in paths:
        try:
            path.unlink(missing_ok=True)
        except OSError:
            logger.exception("Could not remove deleted event flyer asset %s", path)


def _parse_date(value: str | None):
    if not value:
        return None
    try:
        return datetime.strptime(value, "%Y-%m-%d").date()
    except ValueError:
        return None


def cleanup_expired_event_flyers(db: Session) -> int:
    today = date.today()
    expired_flyers = []
    for flyer in db.query(models.EventFlyer).filter(models.EventFlyer.event_end_date.isnot(None)).all():
        end_date = _parse_date(flyer.event_end_date)
        if end_date is None or end_date >= today:
            continue
        expired_flyers.append(flyer)

    files_to_remove = []
    for flyer in expired_flyers:
        files_to_remove.extend(_delete_flyer_and_registrations(db, flyer))
    if expired_flyers:
        db.commit()
        _remove_files(files_to_remove)
    return len(expired_flyers)


@router.get("/")
def list_event_flyers(db: Session = Depends(get_db)):
    cleanup_expired_event_flyers(db)
    return [
        {
            "id": flyer.id, "title": flyer.title, "description": flyer.description,
            "event_date": flyer.event_date, "event_end_date": flyer.event_end_date,
            "registration_deadline": flyer.registration_deadline,
            "organizer": flyer.organizer, "flyer_path": flyer.flyer_path,
            "event_type": flyer.event_type,
            "registration_url": flyer.registration_url,
            "flyer_content_type": flyer.flyer_content_type, "uploaded_by": flyer.uploaded_by,
        }
        for flyer in db.query(models.EventFlyer).order_by(models.EventFlyer.created_at.desc()).all()
    ]


@router.post("/", status_code=201)
async def upload_event_flyer(
    title: str = Form(...),
    description: str | None = Form(None),
    event_date: str | None = Form(None),
    event_end_date: str | None = Form(None),
    registration_deadline: str | None = Form(None),
    organizer: str | None = Form(None),
    event_type: str | None = Form(None),
    registration_url: str | None = Form(None),
    file: UploadFile = File(...),
    db: Session = Depends(get_db),
    user: dict = Depends(get_current_staff_or_admin),
):
    if file.content_type not in ALLOWED_TYPES:
        raise HTTPException(status_code=400, detail="Upload a JPG, PNG, WEBP, or PDF flyer")
    extension = os.path.splitext(file.filename or "")[1].lower()
    if extension not in {".jpg", ".jpeg", ".png", ".webp", ".pdf"}:
        raise HTTPException(status_code=400, detail="Unsupported flyer file extension")
    if registration_url:
        parsed_url = urlparse(registration_url.strip())
        if parsed_url.scheme not in {"http", "https"} or not parsed_url.netloc:
            raise HTTPException(status_code=400, detail="Registration link must be a valid http or https URL")
    contents = await file.read()
    if len(contents) > 10 * 1024 * 1024:
        raise HTTPException(status_code=400, detail="Flyer must be 10 MB or smaller")

    FLYER_DIR.mkdir(parents=True, exist_ok=True)
    filename = f"{uuid4().hex}{extension}"
    (FLYER_DIR / filename).write_bytes(contents)
    flyer = models.EventFlyer(
        title=title.strip(), description=description, event_date=event_date,
        event_end_date=event_end_date,
        registration_deadline=registration_deadline, organizer=organizer, event_type=event_type,
        registration_url=registration_url.strip() if registration_url else None,
        flyer_path=f"/static/event-flyers/{filename}", flyer_content_type=file.content_type,
        uploaded_by=user["email"],
    )
    db.add(flyer)
    db.commit()
    db.refresh(flyer)
    cleanup_expired_event_flyers(db)
    return {"id": flyer.id, "message": "Event flyer uploaded"}


@router.delete("/{flyer_id}")
def delete_event_flyer(
    flyer_id: int,
    db: Session = Depends(get_db),
    user: dict = Depends(get_current_staff_or_admin),
):
    flyer = db.query(models.EventFlyer).filter(models.EventFlyer.id == flyer_id).first()
    if not flyer:
        raise HTTPException(status_code=404, detail="Event flyer not found")
    if user["role"] != "admin" and flyer.uploaded_by != user["email"]:
        raise HTTPException(status_code=403, detail="You can delete only your own flyers")
    files_to_remove = _delete_flyer_and_registrations(db, flyer)
    db.commit()
    _remove_files(files_to_remove)
    return {"message": "Event flyer deleted"}
