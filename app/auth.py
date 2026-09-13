import os
import secrets
from datetime import datetime, timedelta
from typing import Optional

from fastapi import Depends, HTTPException, Header
from jose import jwt, JWTError
from passlib.context import CryptContext
from sqlalchemy.orm import Session

from .database import get_db
from . import models

SECRET_KEY = os.getenv("SECRET_KEY") or secrets.token_hex(32)
ALGORITHM = "HS256"
ACCESS_TOKEN_EXPIRE_MINUTES = 60 * 24 * 7  # 7 days

pwd_context = CryptContext(schemes=["bcrypt"], deprecated="auto")

# ---- Google OAuth (lazy import so app still runs if google-auth isn't installed) ----
id_token = None
grequests = None
GOOGLE_CLIENT_ID = "1035224967035-tda4kp0keod95q5rq11t9p710kkl9l9j.apps.googleusercontent.com"  

def _ensure_google_libs():
    global id_token, grequests
    if id_token is not None and grequests is not None:
        return
    try:
        import google.oauth2.id_token as _id_token
        from google.auth.transport import requests as _grequests
        id_token = _id_token
        grequests = _grequests
    except Exception:
        raise RuntimeError("Missing dependency 'google-auth'. Install via: pip install google-auth")


def verify_google_token(token: str) -> dict:
    try:
        _ensure_google_libs()
        request = grequests.Request()
        info = id_token.verify_oauth2_token(token, request, audience=GOOGLE_CLIENT_ID)
        return info
    except RuntimeError as re:
        raise HTTPException(status_code=500, detail=str(re))
    except Exception as e:
        raise HTTPException(status_code=401, detail=f"Invalid or expired Google token: {e}")


# ---- Normal email/password login ----
def hash_password(password: str) -> str:
    return pwd_context.hash(password)


def verify_password(plain: str, hashed: str) -> bool:
    if not hashed:
        return False
    # Some older database rows were saved with plaintext passwords during setup.
    # Accept those legacy values so the app can self-heal on login.
    if not hashed.startswith("$2"):
        return plain == hashed
    return pwd_context.verify(plain, hashed)


def create_access_token(data: dict) -> str:
    to_encode = data.copy()
    expire = datetime.utcnow() + timedelta(minutes=ACCESS_TOKEN_EXPIRE_MINUTES)
    to_encode.update({"exp": expire})
    return jwt.encode(to_encode, SECRET_KEY, algorithm=ALGORITHM)


def decode_access_token(token: str) -> dict:
    try:
        return jwt.decode(token, SECRET_KEY, algorithms=[ALGORITHM])
    except JWTError:
        raise HTTPException(status_code=401, detail="Invalid or expired token")


# ---- Role-aware access dependencies ----
def get_current_admin(
    authorization: Optional[str] = Header(None),
    db: Session = Depends(get_db),
) -> str:
    if not authorization:
        raise HTTPException(status_code=401, detail="Missing Authorization header")

    parts = authorization.split()
    if len(parts) != 2 or parts[0].lower() != "bearer":
        raise HTTPException(status_code=401, detail="Invalid Authorization header format")

    token = parts[1]

    payload = decode_access_token(token)
    email = payload.get("email")
    if not email:
        raise HTTPException(status_code=403, detail="Administrator access required")
    if payload.get("role") == "admin":
        return email
    # Preserve existing administrator sessions created before role claims existed.
    legacy_admin = db.query(models.AdminUser).filter(
        models.AdminUser.email == email, models.AdminUser.is_active.is_(True)
    ).first()
    if not legacy_admin:
        raise HTTPException(status_code=403, detail="Administrator access required")
    return email


def get_current_student(
    authorization: Optional[str] = Header(None),
    db: Session = Depends(get_db),
) -> dict:
    if not authorization:
        raise HTTPException(status_code=401, detail="Missing Authorization header")

    parts = authorization.split()
    if len(parts) != 2 or parts[0].lower() != "bearer":
        raise HTTPException(status_code=401, detail="Invalid Authorization header format")

    try:
        payload = decode_access_token(parts[1])
    except HTTPException:
        raise HTTPException(status_code=401, detail="Invalid or expired token")

    role = payload.get("role")
    student_id = payload.get("student_id")
    if role != "student" or student_id is None:
        raise HTTPException(status_code=403, detail="Student access required")

    return {"email": payload.get("email"), "role": "student", "student_id": int(student_id)}


def get_current_student_or_admin(
    authorization: Optional[str] = Header(None),
    db: Session = Depends(get_db),
) -> dict:
    if not authorization:
        raise HTTPException(status_code=401, detail="Missing Authorization header")

    parts = authorization.split()
    if len(parts) != 2 or parts[0].lower() != "bearer":
        raise HTTPException(status_code=401, detail="Invalid Authorization header format")

    try:
        payload = decode_access_token(parts[1])
        role = payload.get("role")
        if role == "student":
            student_id = payload.get("student_id")
            if student_id is None:
                raise HTTPException(status_code=401, detail="Student token missing student_id")
            return {"email": payload.get("email"), "role": "student", "student_id": int(student_id)}
        if role == "admin":
            return {"email": payload.get("email"), "role": "admin"}
    except HTTPException:
        pass

    email = get_current_admin(authorization, db)
    return {"email": email, "role": "admin"}


def get_current_staff_or_admin(
    authorization: Optional[str] = Header(None),
    db: Session = Depends(get_db),
) -> dict:
    """Allows staff and administrators to manage the event-flyer board."""
    if not authorization:
        raise HTTPException(status_code=401, detail="Missing Authorization header")
    parts = authorization.split()
    if len(parts) != 2 or parts[0].lower() != "bearer":
        raise HTTPException(status_code=401, detail="Invalid Authorization header format")

    payload = decode_access_token(parts[1])
    email = payload.get("email")
    role = payload.get("role")
    if not email or role not in {"admin", "staff"}:
        raise HTTPException(status_code=403, detail="Staff or administrator access required")
    return {"email": email, "role": role}
