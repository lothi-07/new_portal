from typing import Optional

from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy import func
from sqlalchemy.orm import Session

from .. import models
from ..auth import get_current_admin
from ..database import get_db
from ..email_service import send_achievement_reminder

router = APIRouter(prefix="/notifications", tags=["Notifications"])


def students_below_target(db: Session, minimum: int, year: Optional[str], section: Optional[str]):
    counts = (
        db.query(
            models.Achievement.student_id,
            func.count(models.Achievement.id).label("achievement_count"),
        )
        .group_by(models.Achievement.student_id)
        .subquery()
    )
    count_value = func.coalesce(counts.c.achievement_count, 0)
    query = (
        db.query(models.Student, count_value.label("achievement_count"))
        .outerjoin(counts, counts.c.student_id == models.Student.id)
        .filter(count_value < minimum)
    )
    if year:
        query = query.filter(models.Student.year == year)
    if section:
        query = query.filter(models.Student.section == section.upper())

    return [
        {
            "id": student.id,
            "name": f"{student.first_name} {student.last_name or ''}".strip(),
            "roll_no": student.roll_no,
            "email": student.email,
            "year": student.year,
            "section": student.section,
            "achievement_count": int(achievement_count),
        }
        for student, achievement_count in query.order_by(models.Student.roll_no).all()
    ]


@router.get("/below-target")
def list_students_below_target(
    minimum: int = 1,
    year: Optional[str] = None,
    section: Optional[str] = None,
    db: Session = Depends(get_db),
    admin: str = Depends(get_current_admin),
):
    if minimum < 1:
        raise HTTPException(status_code=400, detail="Achievement target must be at least 1")
    return students_below_target(db, minimum, year, section)


@router.post("/achievement-reminders")
def send_achievement_reminders(
    minimum: int = 1,
    year: Optional[str] = None,
    section: Optional[str] = None,
    db: Session = Depends(get_db),
    admin: str = Depends(get_current_admin),
):
    if minimum < 1:
        raise HTTPException(status_code=400, detail="Achievement target must be at least 1")

    students = students_below_target(db, minimum, year, section)
    recipients = [student for student in students if student["email"]]
    skipped = [student["roll_no"] for student in students if not student["email"]]
    sent = 0
    failures = []

    for student in recipients:
        try:
            send_achievement_reminder(
                student["email"], student["name"], student["achievement_count"], minimum
            )
            sent += 1
        except Exception as exc:
            failures.append({"roll_no": student["roll_no"], "reason": str(exc)})

    return {
        "below_target": len(students),
        "sent": sent,
        "skipped_no_email": skipped,
        "failures": failures,
    }
