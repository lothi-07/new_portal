"""
Loads real student data from the uploaded Excel files into the fresh database.
Run: python3 seed_real_data.py
"""
import sys, os
sys.path.append(os.path.dirname(__file__))

import pandas as pd
from app.database import SessionLocal, engine, Base
from app import models

Base.metadata.create_all(bind=engine)
db = SessionLocal()


seen_rolls = set(r[0] for r in db.query(models.Student.roll_no).all())


def upsert(roll_no, first_name, last_name=None, email=None, mobile=None,
           reg_no=None, year="I", section="A", department="AI & DS", photo_path=None):
    roll_no = roll_no.strip().upper()
    if roll_no in seen_rolls:
        return 0  # already there or already queued this run, skip
    student = models.Student(
        roll_no=roll_no, first_name=first_name, last_name=last_name,
        email=email, mobile_number=mobile, reg_no=reg_no,
        year=year, section=section, department=department, photo_path=photo_path,
    )
    db.add(student)
    seen_rolls.add(roll_no)
    return 1


created = 0

# ---- Section A (I Year) ----
path_a = "/mnt/user-data/uploads/STUDENTS_DETAILS_2024-28.xlsx"
if os.path.exists(path_a):
    xls = pd.ExcelFile(path_a)
    contact = pd.read_excel(xls, sheet_name="CONTACT NUMBER", header=2, usecols=[2, 3, 4])
    contact.columns = ["Roll No", "Name", "Mobile"]
    contact = contact.dropna(subset=["Roll No"])
    mail = pd.read_excel(xls, sheet_name="MAIL ID", header=2, usecols=[5, 6, 7])
    mail.columns = ["Roll No", "Name", "Mail ID"]
    mail = mail.dropna(subset=["Roll No"])
    merged = pd.merge(contact, mail[["Roll No", "Mail ID"]], on="Roll No", how="left")

    for _, row in merged.iterrows():
        name_parts = str(row["Name"]).strip().split(" ", 1)
        mobile = row["Mobile"]
        try:
            mobile = str(int(mobile))
        except (ValueError, TypeError):
            mobile = str(mobile) if pd.notna(mobile) else None
        created += upsert(
            roll_no=str(row["Roll No"]),
            first_name=name_parts[0],
            last_name=name_parts[1] if len(name_parts) > 1 else None,
            email=row["Mail ID"] if pd.notna(row["Mail ID"]) else None,
            mobile=mobile,
            year="I", section="A",
        )
    print(f"Section A processed: {len(merged)} rows")

# ---- Section C (I Year) - file is mislabeled "_B" but roll numbers are C range ----
path_c = "/mnt/user-data/uploads/STUDENT_DETAILS_B.xlsx"
if os.path.exists(path_c):
    df_c = pd.read_excel(path_c, sheet_name="Sheet2", header=12)
    df_c = df_c.dropna(subset=["Roll No"]).reset_index(drop=True)
    df_c.columns = [c.strip() for c in df_c.columns]

    def fmt_mobile(x):
        try:
            return str(int(x))
        except (ValueError, TypeError):
            return str(x) if pd.notna(x) else None

    for _, row in df_c.iterrows():
        name_parts = str(row["Student Name"]).strip().split(" ", 1)
        created += upsert(
            roll_no=str(row["Roll No"]),
            first_name=name_parts[0],
            last_name=name_parts[1] if len(name_parts) > 1 else None,
            email=row["Mail id"] if pd.notna(row["Mail id"]) else None,
            mobile=fmt_mobile(row["Mobile Number"]),
            year="I", section="C",
        )
    print(f"Section C processed: {len(df_c)} rows")

# ---- IV Year Section B ----
path_ivb = "/mnt/user-data/uploads/IV_YR_B_AI_DS_B_DETAILS.xlsx"
photo_dir = "/home/claude/ivb_photos/fotos"
if os.path.exists(path_ivb):
    df_ivb = pd.read_excel(path_ivb, sheet_name="Sheet1")
    df_ivb = df_ivb.dropna(subset=["username"]).reset_index(drop=True)

    for _, row in df_ivb.iterrows():
        roll = str(row["username"]).strip().upper()
        photo_path = None
        if os.path.isdir(photo_dir):
            for ext in [".jpg", ".jpeg", ".png"]:
                candidate = os.path.join(photo_dir, f"{roll.lower()}{ext}")
                if os.path.exists(candidate):
                    photo_path = candidate
                    break
        created += upsert(
            roll_no=roll,
            first_name=str(row.get("firstname", "")).strip(),
            last_name=str(row.get("lastname", "")).strip(),
            email=row.get("email") if pd.notna(row.get("email")) else None,
            mobile=str(row.get("mobile")) if pd.notna(row.get("mobile")) else None,
            reg_no=str(row.get("register no")) if pd.notna(row.get("register no")) else None,
            year="IV", section="B",
            photo_path=photo_path,
        )
    print(f"IV Year Section B processed: {len(df_ivb)} rows")

db.commit()
total = db.query(models.Student).count()
print(f"\nDone. New students added: {created}. Total students in database: {total}")
db.close()
