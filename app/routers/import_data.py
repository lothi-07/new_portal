import os, io, zipfile, tempfile
import pandas as pd
from fastapi import APIRouter, Depends, HTTPException, UploadFile, File, Form
from sqlalchemy.orm import Session

from .. import models
from ..database import get_db
from ..auth import get_current_admin

router = APIRouter(prefix="/import", tags=["Import"])
BASE_DIR = os.path.dirname(os.path.dirname(__file__))
PHOTOS_DIR = os.path.join(BASE_DIR, "static", "photos")


@router.post("/students")
async def import_students(
    year: str = Form(...),
    section: str = Form(...),
    department: str = Form("AI & DS"),
    students_file: UploadFile = File(...),
    photos_zip: UploadFile = File(None),
    db: Session = Depends(get_db),
    admin: str = Depends(get_current_admin),
):
    """
    students_file: .xlsx with at least columns for roll number, name, email, mobile
    (column names are matched flexibly, case-insensitive)
    photos_zip: optional .zip of photos, each named exactly as the roll number (e.g. ES24AD62.jpg)
    """
    # --- Read student data ---
    contents = await students_file.read()
    try:
        df = pd.read_excel(io.BytesIO(contents))
    except Exception as e:
        raise HTTPException(status_code=400, detail=f"Could not read Excel file: {e}")

    df.columns = [str(c).strip().lower() for c in df.columns]

    def find_col(candidates):
        for c in candidates:
            if c in df.columns:
                return c
        return None

    col_roll = find_col(["roll no", "roll_no", "rollnumber", "username", "roll number", "roll"])
    col_name = find_col(["name", "student name", "username","firstname"])
    col_last = find_col(["last name", "lastname"])
    col_email = find_col(["mail id", "email", "mail"])
    col_mobile = find_col(["mobile number", "mobile", "phone"])
    col_reg = find_col(["register no", "reg no", "register_no", "register number"])

    if not col_roll or not col_name:
        raise HTTPException(status_code=400, detail="Could not find roll number / name columns in the file")

    # --- Extract photos zip (if provided), keyed by roll number ---
    from ..storage import upload_photo_bytes
    photo_map = {}
    if photos_zip is not None:
        zip_bytes = await photos_zip.read()
        with zipfile.ZipFile(io.BytesIO(zip_bytes)) as zf:
            for name in zf.namelist():
                base = os.path.basename(name)
                if not base or base.startswith("__MACOSX") or "." not in base:
                    continue
                roll_key = os.path.splitext(base)[0].strip().strip("'").upper()
                ext = os.path.splitext(base)[1]
                public_url = upload_photo_bytes(zf.read(name), f"{roll_key}{ext}")
                photo_map[roll_key] = public_url

    created, updated, skipped = 0, 0, 0
    for _, row in df.iterrows():
        roll_no = str(row.get(col_roll, "")).strip().upper()
        if not roll_no or roll_no == "NAN":
            skipped += 1
            continue

        first_name = str(row.get(col_name, "")).strip()
        last_name = str(row.get(col_last, "")).strip() if col_last else None
        email = str(row.get(col_email, "")).strip() if col_email else None
        mobile = row.get(col_mobile) if col_mobile else None
        if pd.notna(mobile):
            try:
                mobile = str(int(mobile))
            except (ValueError, TypeError):
                mobile = str(mobile)
        else:
            mobile = None
        reg_no = str(row.get(col_reg, "")).strip() if col_reg else None

        photo_path = photo_map.get(roll_no)

        existing = db.query(models.Student).filter(models.Student.roll_no == roll_no).first()
        if existing:
            existing.first_name = first_name or existing.first_name
            existing.last_name = last_name or existing.last_name
            existing.email = email or existing.email
            existing.mobile_number = mobile or existing.mobile_number
            existing.reg_no = reg_no or existing.reg_no
            existing.year = year
            existing.section = section.upper()
            existing.department = department
            if photo_path:
                existing.photo_path = photo_path
            updated += 1
        else:
            student = models.Student(
                roll_no=roll_no, first_name=first_name, last_name=last_name,
                email=email, mobile_number=mobile, reg_no=reg_no,
                year=year, section=section.upper(), department=department,
                photo_path=photo_path,
            )
            db.add(student)
            created += 1

    db.commit()
    return {
        "message": "Import complete",
        "created": created,
        "updated": updated,
        "skipped_rows": skipped,
        "photos_matched": len(photo_map),
    }
