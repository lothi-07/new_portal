import os
from fastapi import APIRouter, Depends, HTTPException
from fastapi.responses import FileResponse
from sqlalchemy.orm import Session
from sqlalchemy import func
from typing import Optional

from .. import models
from ..database import get_db
from ..auth import get_current_admin
from ..poster_gen import generate_poster

router = APIRouter(prefix="/certificates", tags=["Certificates"])
BASE_DIR = os.path.dirname(os.path.dirname(__file__))
GENERATED_DIR = os.path.join(BASE_DIR, "static", "generated")


@router.get("/eligible")
def eligible_students(year: str, min_achievements: int = 1, db: Session = Depends(get_db)):
    counts = dict(
        db.query(models.Achievement.student_id, func.count(models.Achievement.id))
        .group_by(models.Achievement.student_id).all()
    )
    students = db.query(models.Student).filter(models.Student.year == year).all()
    eligible = [
        {
            "id": s.id, "name": f"{s.first_name} {s.last_name or ''}".strip(),
            "roll_no": s.roll_no, "section": s.section,
            "achievement_count": counts.get(s.id, 0),
        }
        for s in students if counts.get(s.id, 0) >= min_achievements
    ]
    return sorted(eligible, key=lambda x: x["achievement_count"], reverse=True)


@router.post("/generate/{student_id}")
def generate_for_student(
    student_id: int,
    db: Session = Depends(get_db),
    admin: str = Depends(get_current_admin),
):
    """Generates one combined certificate for a student showing their top/most recent achievement."""
    student = db.query(models.Student).filter(models.Student.id == student_id).first()
    if not student:
        raise HTTPException(status_code=404, detail="Student not found")

    achievements = db.query(models.Achievement).filter(models.Achievement.student_id == student_id).all()
    if not achievements:
        raise HTTPException(status_code=400, detail="Student has no achievements")

    top = achievements[-1]  # most recently added
    full_name = f"{student.first_name} {student.last_name or ''}".strip()

    os.makedirs(GENERATED_DIR, exist_ok=True)
    output_type = "certificate" if len(achievements) > 1 else "poster"
    filename = f"{output_type}_{student.roll_no}_bulk.png"
    output_path = os.path.join(GENERATED_DIR, filename)

    photo_path = student.photo_path if student.photo_path and os.path.exists(student.photo_path) else None

    generate_poster(
        student_name=full_name,
        event_name=top.event_name,
        prize_type=top.prize_type or "Participation",
        photo_path=photo_path,
        output_path=output_path,
    )

    return {"output_path": f"/static/generated/{filename}", "output_type": output_type}


@router.get("/download")
def download_certificate(path: str):
    """path should be like /static/generated/xxxx.png"""
    full_path = os.path.join(BASE_DIR, path.lstrip("/").replace("static/", "static/", 1))
    if not os.path.exists(full_path):
        raise HTTPException(status_code=404, detail="File not found")
    return FileResponse(full_path, filename=os.path.basename(full_path), media_type="image/png")
