import os
from pathlib import Path
from uuid import uuid4

from fastapi import APIRouter, Depends, File, Form, HTTPException, UploadFile
from sqlalchemy.orm import Session

from .. import models
from ..auth import get_current_staff_or_admin
from ..database import get_db

router = APIRouter(prefix="/event-flyers", tags=["Event Flyers"])
FLYER_DIR = Path(__file__).resolve().parent.parent / "static" / "event-flyers"
ALLOWED_TYPES = {"image/jpeg", "image/png", "image/webp", "application/pdf"}


@router.get("/")
def list_event_flyers(db: Session = Depends(get_db)):
    return [
        {
            "id": flyer.id, "title": flyer.title, "description": flyer.description,
            "event_date": flyer.event_date, "registration_deadline": flyer.registration_deadline,
            "organizer": flyer.organizer, "flyer_path": flyer.flyer_path,
            "flyer_content_type": flyer.flyer_content_type, "uploaded_by": flyer.uploaded_by,
        }
        for flyer in db.query(models.EventFlyer).order_by(models.EventFlyer.created_at.desc()).all()
    ]


@router.post("/", status_code=201)
async def upload_event_flyer(
    title: str = Form(...),
    description: str | None = Form(None),
    event_date: str | None = Form(None),
    registration_deadline: str | None = Form(None),
    organizer: str | None = Form(None),
    file: UploadFile = File(...),
    db: Session = Depends(get_db),
    user: dict = Depends(get_current_staff_or_admin),
):
    if file.content_type not in ALLOWED_TYPES:
        raise HTTPException(status_code=400, detail="Upload a JPG, PNG, WEBP, or PDF flyer")
    extension = os.path.splitext(file.filename or "")[1].lower()
    if extension not in {".jpg", ".jpeg", ".png", ".webp", ".pdf"}:
        raise HTTPException(status_code=400, detail="Unsupported flyer file extension")
    contents = await file.read()
    if len(contents) > 10 * 1024 * 1024:
        raise HTTPException(status_code=400, detail="Flyer must be 10 MB or smaller")

    FLYER_DIR.mkdir(parents=True, exist_ok=True)
    filename = f"{uuid4().hex}{extension}"
    (FLYER_DIR / filename).write_bytes(contents)
    flyer = models.EventFlyer(
        title=title.strip(), description=description, event_date=event_date,
        registration_deadline=registration_deadline, organizer=organizer,
        flyer_path=f"/static/event-flyers/{filename}", flyer_content_type=file.content_type,
        uploaded_by=user["email"],
    )
    db.add(flyer)
    db.commit()
    db.refresh(flyer)
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
    file_path = FLYER_DIR / Path(flyer.flyer_path).name
    if file_path.exists():
        file_path.unlink()
    db.delete(flyer)
    db.commit()
    return {"message": "Event flyer deleted"}
