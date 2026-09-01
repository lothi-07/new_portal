import os, io
from fastapi import APIRouter, Depends, HTTPException, UploadFile, File, Form
from sqlalchemy.orm import Session
from typing import Optional, List

from .. import models, schemas
from ..database import get_db
from ..auth import get_current_admin, get_current_student_or_admin
from ..poster_gen import generate_poster

router = APIRouter(prefix="/achievements", tags=["Achievements"])

BASE_DIR = os.path.dirname(os.path.dirname(__file__))
GENERATED_DIR = os.path.join(BASE_DIR, "static", "generated")
UPLOADS_DIR = os.path.join(BASE_DIR, "static", "uploads")


@router.get("/", response_model=List[schemas.AchievementOut])
def list_achievements(
    event_type: Optional[str] = None,
    prize_type: Optional[str] = None,
    student_id: Optional[int] = None,
    db: Session = Depends(get_db),
):
    query = db.query(models.Achievement)
    if event_type:
        query = query.filter(models.Achievement.event_type == event_type)
    if prize_type:
        query = query.filter(models.Achievement.prize_type == prize_type)
    if student_id:
        query = query.filter(models.Achievement.student_id == student_id)
    return query.order_by(models.Achievement.event_date.desc()).all()


@router.post("/", response_model=schemas.AchievementOut)
def create_achievement(
    achievement: schemas.AchievementCreate,
    db: Session = Depends(get_db),
    current_user: dict = Depends(get_current_student_or_admin),
):
    student = db.query(models.Student).filter(models.Student.id == achievement.student_id).first()
    if not student:
        raise HTTPException(status_code=404, detail="Student not found")
    if current_user.get("role") == "student" and current_user.get("student_id") != achievement.student_id:
        raise HTTPException(status_code=403, detail="You can add achievements only for your own profile")
    db_achievement = models.Achievement(**achievement.model_dump(), source="manual")
    db.add(db_achievement)
    db.commit()
    db.refresh(db_achievement)
    return db_achievement


@router.post("/upload-certificate", response_model=schemas.AchievementOut)
def upload_certificate(
    student_id: int = Form(...),
    event_name: str = Form(...),
    event_type: str = Form("Technical"),
    prize_type: str = Form("Participation"),
    event_date: str = Form(""),
    organizer: str = Form(""),
    file: UploadFile = File(...),
    db: Session = Depends(get_db),
    current_user: dict = Depends(get_current_student_or_admin),
):
    """
    Faculty uploads a photo of a physical certificate. This auto-creates an
    achievement record (source='certificate_upload') and stores the raw photo
    alongside it for reference.
    """
    student = db.query(models.Student).filter(models.Student.id == student_id).first()
    if not student:
        raise HTTPException(status_code=404, detail="Student not found")
    if current_user.get("role") == "student" and current_user.get("student_id") != student_id:
        raise HTTPException(status_code=403, detail="You can upload certificates only for your own profile")

    os.makedirs(UPLOADS_DIR, exist_ok=True)
    ext = os.path.splitext(file.filename)[1] or ".jpg"
    safe_name = f"{student.roll_no}_{event_name[:20].replace(' ','_')}{ext}"
    upload_path = os.path.join(UPLOADS_DIR, safe_name)
    public_path = f"/static/uploads/{os.path.basename(upload_path)}"
    with open(upload_path, "wb") as f:
        f.write(file.file.read())

    db_achievement = models.Achievement(
        student_id=student_id,
        event_name=event_name,
        event_type=event_type,
        prize_type=prize_type,
        event_date=event_date or None,
        organizer=organizer or None,
        source="certificate_upload",
        certificate_upload_path=public_path,
    )
    db.add(db_achievement)
    db.commit()
    db.refresh(db_achievement)
    return db_achievement


@router.delete("/{achievement_id}")
def delete_achievement(
    achievement_id: int,
    db: Session = Depends(get_db),
    current_user: dict = Depends(get_current_student_or_admin),
):
    db_a = db.query(models.Achievement).filter(models.Achievement.id == achievement_id).first()
    if not db_a:
        raise HTTPException(status_code=404, detail="Achievement not found")
    if current_user.get("role") == "student" and current_user.get("student_id") != db_a.student_id:
        raise HTTPException(status_code=403, detail="You can delete only your own achievements")
    db.delete(db_a)
    db.commit()
    return {"message": "Achievement deleted"}


@router.post("/{achievement_id}/generate-output")
def generate_output(
    achievement_id: int,
    db: Session = Depends(get_db),
    admin: str = Depends(get_current_admin),
):
    achievement = db.query(models.Achievement).filter(models.Achievement.id == achievement_id).first()
    if not achievement:
        raise HTTPException(status_code=404, detail="Achievement not found")

    student = db.query(models.Student).filter(models.Student.id == achievement.student_id).first()
    total_wins = db.query(models.Achievement).filter(models.Achievement.student_id == student.id).count()

    output_type = "poster" if total_wins <= 1 else "certificate"
    full_name = f"{student.first_name} {student.last_name or ''}".strip()

    os.makedirs(GENERATED_DIR, exist_ok=True)
    filename = f"{output_type}_{student.roll_no}_{achievement.id}.png"
    output_path = os.path.join(GENERATED_DIR, filename)

    photo_path = student.photo_path if student.photo_path and os.path.exists(student.photo_path) else None

    generate_poster(
        student_name=full_name,
        event_name=achievement.event_name,
        prize_type=achievement.prize_type or "Participation",
        photo_path=photo_path,
        output_path=output_path,
    )

    achievement.output_type = output_type
    achievement.output_path = f"/static/generated/{filename}"
    db.commit()
    db.refresh(achievement)

    return {
        "message": f"{output_type.capitalize()} generated",
        "output_type": output_type,
        "output_path": achievement.output_path,
    }
