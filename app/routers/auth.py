from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session

from .. import models, schemas
from ..database import get_db
from ..auth import hash_password, verify_password, create_access_token, verify_google_token, get_current_admin

router = APIRouter(prefix="/auth", tags=["Auth"])


@router.post("/signup", response_model=schemas.TokenOut)
def signup(payload: schemas.AdminSignup, db: Session = Depends(get_db)):
    existing = db.query(models.AdminUser).filter(models.AdminUser.email == payload.email).first()
    if existing:
        raise HTTPException(status_code=400, detail="An account with this email already exists")
    user = models.AdminUser(
        email=payload.email,
        hashed_password=hash_password(payload.password),
        name=payload.name,
    )
    db.add(user)
    db.commit()
    db.refresh(user)
    token = create_access_token({"email": user.email, "type": "local", "role": "admin"})
    return {"access_token": token, "email": user.email, "name": user.name, "role": "admin"}


@router.post("/login", response_model=schemas.TokenOut)
def login(payload: schemas.AdminLogin, db: Session = Depends(get_db)):
    user = db.query(models.AdminUser).filter(models.AdminUser.email == payload.email).first()
    role = "admin"
    if not user:
        user = db.query(models.StaffUser).filter(models.StaffUser.email == payload.email).first()
        role = "staff"
    if not user or not user.is_active:
        raise HTTPException(status_code=401, detail="Incorrect email or password")
    if not verify_password(payload.password, user.hashed_password):
        raise HTTPException(status_code=401, detail="Incorrect email or password")
    if user.hashed_password and not user.hashed_password.startswith("$"):
        user.hashed_password = hash_password(payload.password)
        db.commit()
    token = create_access_token({"email": user.email, "type": "local", "role": role})
    return {"access_token": token, "email": user.email, "name": user.name, "role": role}


@router.post("/google", response_model=schemas.TokenOut)
def google_login(body: dict, db: Session = Depends(get_db)):
    """Frontend sends { credential: '<google id token>' }."""
    credential = body.get("credential")
    if not credential:
        raise HTTPException(status_code=400, detail="Missing 'credential'")
    info = verify_google_token(credential)
    email = info.get("email")
    name = info.get("name")
    # We just pass the Google token straight back — get_current_admin() can verify it directly too.
    return {"access_token": credential, "email": email, "name": name, "role": "admin"}

@router.post("/student-login")
def student_login(body: dict, db: Session = Depends(get_db)):
    """Students log in with Roll Number + Mobile Number (no password needed)."""
    roll_no = str(body.get("roll_no", "")).strip().upper()
    mobile_input = str(body.get("mobile", "")).strip()

    student = db.query(models.Student).filter(models.Student.roll_no == roll_no).first()
    if not student or not student.mobile_number:
        raise HTTPException(status_code=401, detail="Roll number or mobile number is incorrect")

    # compare digits only, in case of spaces/dashes/leading zeros differences
    stored = "".join(filter(str.isdigit, student.mobile_number))
    typed = "".join(filter(str.isdigit, mobile_input))

    if stored[-10:] != typed[-10:]:  # compare last 10 digits (ignores country code differences)
        raise HTTPException(status_code=401, detail="Roll number or mobile number is incorrect")

    token = create_access_token({"student_id": student.id, "email": student.email or student.roll_no, "role": "student"})
    return {
        "access_token": token,
        "student_id": student.id,
        "roll_no": student.roll_no,
        "first_name": student.first_name,
        "last_name": student.last_name,
        "name": f"{student.first_name} {student.last_name or ''}".strip(),
        "email": student.email,
        "section": student.section,
        "year": student.year,
        "department": student.department,
        "mobile_number": student.mobile_number,
        "role": "student",
    }

@router.post("/staff", response_model=schemas.TokenOut)
def create_staff_account(
    payload: schemas.StaffCreate,
    db: Session = Depends(get_db),
    admin: str = Depends(get_current_admin),
):
    if db.query(models.AdminUser).filter(models.AdminUser.email == payload.email).first() or \
       db.query(models.StaffUser).filter(models.StaffUser.email == payload.email).first():
        raise HTTPException(status_code=400, detail="An account with this email already exists")
    user = models.StaffUser(email=payload.email, hashed_password=hash_password(payload.password), name=payload.name)
    db.add(user)
    db.commit()
    db.refresh(user)
    # The created staff account must sign in separately; this token is not used by the admin UI.
    token = create_access_token({"email": user.email, "type": "local", "role": "staff"})
    return {"access_token": token, "email": user.email, "name": user.name, "role": "staff"}
