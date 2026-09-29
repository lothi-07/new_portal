import io
import os
from fastapi import APIRouter, Depends, HTTPException, UploadFile, File, Form
from fastapi.responses import StreamingResponse
from sqlalchemy.orm import Session
from sqlalchemy import func, or_, text
from sqlalchemy.exc import IntegrityError
from typing import Optional, List
import openpyxl
from openpyxl.styles import Font, PatternFill

from .. import models, schemas
from ..database import get_db
from ..auth import get_current_admin, get_current_student_or_admin, get_current_staff_or_admin
from ..storage import public_photo_url

router = APIRouter(prefix="/students", tags=["Students"])


@router.get("/my-mentees")
def list_my_mentees(
    current_user: dict = Depends(get_current_staff_or_admin),
    db: Session = Depends(get_db),
):
    """Return every student assigned to the signed-in staff mentor, not only event participants."""
    query = db.query(models.Student).order_by(models.Student.roll_no)
    if current_user["role"] == "staff":
        mentor = db.query(models.StaffUser).filter(
            models.StaffUser.email == current_user["email"],
            models.StaffUser.is_active.is_(True),
        ).first()
        if not mentor:
            raise HTTPException(status_code=403, detail="Active staff account not found")
        query = query.filter(models.Student.mentor_id == mentor.id)

    students = query.all()
    return [
        {
            "id": student.id,
            "roll_no": student.roll_no,
            "reg_no": student.reg_no,
            "name": f"{student.first_name} {student.last_name or ''}".strip(),
            "email": student.email,
            "mobile_number": student.mobile_number,
            "year": student.year,
            "section": student.section,
            "department": student.department,
            "photo_path": public_photo_url(student.photo_path, student.roll_no),
            "total_points": student.total_points or 0,
            "total_events": student.total_events or 0,
            "current_badge": student.current_badge,
            "achievement_count": len(student.achievements),
            "achievements": [
                {
                    "id": achievement.id,
                    "event_name": achievement.event_name,
                    "event_type": achievement.event_type,
                    "prize_type": achievement.prize_type,
                    "event_date": achievement.event_date,
                    "organizer": achievement.organizer,
                    "college_name": achievement.college_name,
                    "certificate_upload_path": achievement.certificate_upload_path,
                }
                for achievement in sorted(
                    student.achievements,
                    key=lambda item: item.event_date or "",
                    reverse=True,
                )
            ],
        }
        for student in students
    ]


@router.get("/", response_model=List[schemas.StudentOut])
def list_students(
    year: Optional[str] = None,
    section: Optional[str] = None,
    department: Optional[str] = None,
    name: Optional[str] = None,
    db: Session = Depends(get_db),
):
    query = db.query(models.Student)
    if year:
        query = query.filter(models.Student.year == year)
    if section:
        query = query.filter(models.Student.section == section.upper())
    if department:
        query = query.filter(models.Student.department == department)
    if name:
        like = f"%{name}%"
        query = query.filter(
            or_(
                models.Student.roll_no.ilike(like),
                models.Student.first_name.ilike(like),
                models.Student.last_name.ilike(like),
                models.Student.email.ilike(like),
            )
        )
    students = query.order_by(models.Student.roll_no).all()

    counts = dict(
        db.query(models.Achievement.student_id, func.count(models.Achievement.id))
        .group_by(models.Achievement.student_id).all()
    )
    out = []
    for s in students:
        d = schemas.StudentOut.model_validate(s).model_dump()
        d["achievement_count"] = counts.get(s.id, 0)
        d["mentor_name"] = s.mentor.name if s.mentor else None
        d["mentor_email"] = s.mentor.email if s.mentor else None
        d["photo_path"] = public_photo_url(d.get("photo_path"), s.roll_no)
        out.append(d)
    return out


@router.get("/export")
def export_students(
    year: Optional[str] = None,
    section: Optional[str] = None,
    db: Session = Depends(get_db),
):
    query = db.query(models.Student)
    if year:
        query = query.filter(models.Student.year == year)
    if section:
        query = query.filter(models.Student.section == section.upper())
    students = query.order_by(models.Student.roll_no).all()

    wb = openpyxl.Workbook()
    ws = wb.active
    ws.title = "Students"
    headers = ["S No", "Roll No", "Reg No", "Name", "Year", "Section", "Dept", "Email", "Mobile"]
    ws.append(headers)
    for c in ws[1]:
        c.font = Font(bold=True, color="FFFFFF")
        c.fill = PatternFill(start_color="4B3F72", end_color="4B3F72", fill_type="solid")

    for i, s in enumerate(students, start=1):
        ws.append([
            i, s.roll_no, s.reg_no or "", f"{s.first_name} {s.last_name or ''}".strip(),
            s.year, s.section, s.department, s.email or "", s.mobile_number or "",
        ])

    buf = io.BytesIO()
    wb.save(buf)
    buf.seek(0)
    return StreamingResponse(
        buf,
        media_type="application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
        headers={"Content-Disposition": "attachment; filename=students_export.xlsx"},
    )


@router.put("/bulk/mentor")
def assign_mentor_to_students(
    payload: schemas.BulkMentorAssignment,
    db: Session = Depends(get_db),
    admin: str = Depends(get_current_admin),
):
    student_ids = list(dict.fromkeys(payload.student_ids))
    if not student_ids:
        raise HTTPException(status_code=400, detail="Select at least one student")

    mentor = None
    if payload.mentor_id is not None:
        mentor = db.query(models.StaffUser).filter(
            models.StaffUser.id == payload.mentor_id,
            models.StaffUser.is_active.is_(True),
        ).first()
        if not mentor:
            raise HTTPException(status_code=404, detail="Active staff mentor not found")

    students = db.query(models.Student).filter(models.Student.id.in_(student_ids)).all()
    if len(students) != len(student_ids):
        raise HTTPException(status_code=404, detail="One or more selected students were not found")

    for student in students:
        student.mentor_id = payload.mentor_id
    db.commit()

    return {
        "updated_count": len(students),
        "mentor_id": mentor.id if mentor else None,
        "mentor_name": mentor.name if mentor else None,
        "mentor_email": mentor.email if mentor else None,
    }


@router.delete("/mentors")
def reset_all_mentor_assignments(
    db: Session = Depends(get_db),
    admin: str = Depends(get_current_admin),
):
    """Clear every student-to-mentor assignment so administrators can start over."""
    updated_count = db.query(models.Student).filter(
        models.Student.mentor_id.isnot(None)
    ).update(
        {models.Student.mentor_id: None},
        synchronize_session=False,
    )
    db.commit()
    return {"updated_count": updated_count}


@router.put("/self/mentor")
def assign_students_to_self(
    payload: schemas.SelfMentorAssignment,
    db: Session = Depends(get_db),
    current_user: dict = Depends(get_current_staff_or_admin),
):
    """Allow staff to claim selected students as their own mentees."""
    if current_user["role"] != "staff":
        raise HTTPException(status_code=403, detail="Only staff members can self-assign mentees")

    student_ids = list(dict.fromkeys(payload.student_ids))
    if not student_ids:
        raise HTTPException(status_code=400, detail="Select at least one student")

    mentor = db.query(models.StaffUser).filter(
        models.StaffUser.email == current_user["email"],
        models.StaffUser.is_active.is_(True),
    ).first()
    if not mentor:
        raise HTTPException(status_code=403, detail="Active staff account not found")

    students = db.query(models.Student).filter(models.Student.id.in_(student_ids)).all()
    if len(students) != len(student_ids):
        raise HTTPException(status_code=404, detail="One or more selected students were not found")

    for student in students:
        student.mentor_id = mentor.id
    db.commit()

    return {
        "updated_count": len(students),
        "mentor_id": mentor.id,
        "mentor_name": mentor.name,
        "mentor_email": mentor.email,
    }


@router.get("/{student_id}", response_model=schemas.StudentDetail)
def get_student(student_id: int, db: Session = Depends(get_db)):
    student = db.query(models.Student).filter(models.Student.id == student_id).first()
    if not student:
        raise HTTPException(status_code=404, detail="Student not found")
    result = schemas.StudentDetail.model_validate(student).model_dump()
    result["mentor_name"] = student.mentor.name if student.mentor else None
    result["mentor_email"] = student.mentor.email if student.mentor else None
    result["photo_path"] = public_photo_url(result.get("photo_path"), student.roll_no)
    return result


@router.get("/{student_id}/export")
def export_single_student(student_id: int, db: Session = Depends(get_db)):
    student = db.query(models.Student).filter(models.Student.id == student_id).first()
    if not student:
        raise HTTPException(status_code=404, detail="Student not found")

    wb = openpyxl.Workbook()
    ws = wb.active
    ws.title = "Profile"
    ws.append(["Field", "Value"])
    for c in ws[1]:
        c.font = Font(bold=True, color="FFFFFF")
        c.fill = PatternFill(start_color="4B3F72", end_color="4B3F72", fill_type="solid")

    ws.append(["Name", f"{student.first_name} {student.last_name or ''}".strip()])
    ws.append(["Roll No", student.roll_no])
    ws.append(["Reg No", student.reg_no or ""])
    ws.append(["Year", student.year])
    ws.append(["Section", student.section])
    ws.append(["Department", student.department])
    ws.append(["Email", student.email or ""])
    ws.append(["Mobile", student.mobile_number or ""])

    ws2 = wb.create_sheet("Achievements")
    ws2.append(["S No", "Event Name", "Event Type", "Prize", "Date", "Organizer"])
    for c in ws2[1]:
        c.font = Font(bold=True, color="FFFFFF")
        c.fill = PatternFill(start_color="2E7D5B", end_color="2E7D5B", fill_type="solid")
    for i, a in enumerate(student.achievements, start=1):
        ws2.append([i, a.event_name, a.event_type or "", a.prize_type or "", a.event_date or "", a.organizer or ""])

    buf = io.BytesIO()
    wb.save(buf)
    buf.seek(0)
    fname = f"{student.roll_no}_profile.xlsx"
    return StreamingResponse(
        buf,
        media_type="application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
        headers={"Content-Disposition": f"attachment; filename={fname}"},
    )


@router.post("/", response_model=schemas.StudentOut)
def create_student(
    student: schemas.StudentCreate,
    db: Session = Depends(get_db),
    admin: str = Depends(get_current_admin),
):
    normalized_roll_no = student.roll_no.strip().upper()
    if db.query(models.Student).filter(
        models.Student.roll_no == normalized_roll_no
    ).first():
        raise HTTPException(
            status_code=409,
            detail=f"Student with roll number {normalized_roll_no} already exists",
        )

    if db.bind and db.bind.dialect.name == "postgresql":
        db.execute(
            text(
                "SELECT setval("
                "pg_get_serial_sequence('students', 'id'), "
                "COALESCE((SELECT MAX(id) FROM students), 0) + 1, false)"
            )
        )

    student_data = student.model_dump()
    student_data["roll_no"] = normalized_roll_no
    db_student = models.Student(**student_data)
    db.add(db_student)
    try:
        db.commit()
    except IntegrityError as exc:
        db.rollback()
        raise HTTPException(
            status_code=409,
            detail="Student could not be added because a record with the same ID or roll number already exists",
        ) from exc
    db.refresh(db_student)
    return db_student


@router.put("/{student_id}/mentor")
def assign_mentor(
    student_id: int,
    mentor_id: Optional[int] = None,
    db: Session = Depends(get_db),
    current_user: dict = Depends(get_current_staff_or_admin),
):
    if current_user["role"] == "staff":
        mentor = db.query(models.StaffUser).filter(
            models.StaffUser.email == current_user["email"],
            models.StaffUser.is_active.is_(True),
        ).first()
        if not mentor:
            raise HTTPException(status_code=403, detail="Active staff account not found")
        mentor_id = mentor.id

    student = db.query(models.Student).filter(models.Student.id == student_id).first()
    if not student:
        raise HTTPException(status_code=404, detail="Student not found")
    mentor = None
    if mentor_id is not None:
        mentor = db.query(models.StaffUser).filter(
            models.StaffUser.id == mentor_id,
            models.StaffUser.is_active.is_(True),
        ).first()
        if not mentor:
            raise HTTPException(status_code=404, detail="Active staff mentor not found")
    student.mentor_id = mentor_id
    db.commit()
    return {
        "student_id": student.id,
        "mentor_id": mentor.id if mentor else None,
        "mentor_name": mentor.name if mentor else None,
        "mentor_email": mentor.email if mentor else None,
    }


@router.delete("/{student_id}/mentor")
def remove_student_mentor(
    student_id: int,
    db: Session = Depends(get_db),
    current_user: dict = Depends(get_current_staff_or_admin),
):
    student = db.query(models.Student).filter(models.Student.id == student_id).first()
    if not student:
        raise HTTPException(status_code=404, detail="Student not found")
    if current_user["role"] == "staff":
        mentor = db.query(models.StaffUser).filter(
            models.StaffUser.email == current_user["email"],
            models.StaffUser.is_active.is_(True),
        ).first()
        if not mentor:
            raise HTTPException(status_code=403, detail="Active staff account not found")
        if student.mentor_id != mentor.id:
            raise HTTPException(status_code=403, detail="You can only unassign students assigned to you")
    student.mentor_id = None
    db.commit()
    return {
        "student_id": student.id,
        "mentor_id": None,
        "mentor_name": None,
        "mentor_email": None,
    }


@router.put("/{student_id}", response_model=schemas.StudentOut)
def update_student(
    student_id: int,
    student: schemas.StudentCreate,
    db: Session = Depends(get_db),
    admin: str = Depends(get_current_admin),
):
    db_student = db.query(models.Student).filter(models.Student.id == student_id).first()
    if not db_student:
        raise HTTPException(status_code=404, detail="Student not found")
    for key, value in student.model_dump().items():
        setattr(db_student, key, value)
    db.commit()
    db.refresh(db_student)
    return db_student


@router.delete("/bulk/by-class")
def delete_students_by_class(
    year: str,
    section: str,
    db: Session = Depends(get_db),
    admin: str = Depends(get_current_admin),
):
    """Deletes ALL students (and their achievements) matching year + section."""
    query = db.query(models.Student).filter(
        models.Student.year == year,
        models.Student.section == section.upper(),
    )
    count = query.count()
    if count == 0:
        raise HTTPException(status_code=404, detail="No students match this year/section")

    for student in query.all():
        db.delete(student)
    db.commit()

    return {"message": f"Deleted {count} students", "deleted_count": count}


@router.delete("/{student_id}")
def delete_student(
    student_id: int,
    db: Session = Depends(get_db),
    admin: str = Depends(get_current_admin),
):
    db_student = db.query(models.Student).filter(models.Student.id == student_id).first()
    if not db_student:
        raise HTTPException(status_code=404, detail="Student not found")
    db.delete(db_student)
    db.commit()
    return {"message": "Student deleted"}

@router.post("/{student_id}/upload-photo")
def upload_student_photo(
    student_id: int,
    file: UploadFile = File(...),
    db: Session = Depends(get_db),
    current_user: dict = Depends(get_current_student_or_admin),
):
    from ..storage import upload_photo_bytes
    student = db.query(models.Student).filter(models.Student.id == student_id).first()
    if not student:
        raise HTTPException(status_code=404, detail="Student not found")

    if current_user.get("role") == "student" and current_user.get("student_id") != student_id:
        raise HTTPException(status_code=403, detail="You can upload only your own photo")

    ext = (os.path.splitext(file.filename)[1] or ".jpg").lower()
    file_bytes = file.file.read()
    public_url = upload_photo_bytes(file_bytes, f"{student.roll_no}{ext}")

    student.photo_path = public_url
    db.commit()
    return {"message": "Photo uploaded", "photo_path": public_url}
