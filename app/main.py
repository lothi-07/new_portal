from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from fastapi.staticfiles import StaticFiles
import os
import sqlite3
import asyncio
import logging
from sqlalchemy import text

from . import models
from .database import engine, DATABASE_URL
from .routers import students, achievements, dashboard, events, certificates, import_data, auth, notifications, event_flyers, gamification, registrations


def ensure_sqlite_roll_no_index_is_not_unique():
    if 'sqlite' not in DATABASE_URL:
        return
    db_path = DATABASE_URL.replace('sqlite:///./', './').replace('sqlite:///', '').replace('sqlite://', '')
    if not db_path or db_path.startswith('file:'):
        return
    if not os.path.exists(db_path):
        return
    try:
        with sqlite3.connect(db_path) as conn:
            indexes = conn.execute("SELECT name FROM sqlite_master WHERE type='index' AND tbl_name='students' AND name='ix_students_roll_no'").fetchall()
            if indexes:
                conn.execute('DROP INDEX ix_students_roll_no')
    except Exception:
        pass


def ensure_event_flyer_event_type_column():
    if 'sqlite' not in DATABASE_URL:
        return
    db_path = DATABASE_URL.replace('sqlite:///./', './').replace('sqlite:///', '').replace('sqlite://', '')
    if not db_path or db_path.startswith('file:') or not os.path.exists(db_path):
        return
    try:
        with sqlite3.connect(db_path) as conn:
            columns = {row[1] for row in conn.execute("PRAGMA table_info(event_flyers)").fetchall()}
            if 'event_type' not in columns:
                conn.execute('ALTER TABLE event_flyers ADD COLUMN event_type VARCHAR')
    except Exception:
        pass


def ensure_event_flyer_registration_url_column():
    if 'postgresql' in DATABASE_URL:
        with engine.begin() as conn:
            conn.execute(text(
                "ALTER TABLE event_flyers ADD COLUMN IF NOT EXISTS registration_url VARCHAR"
            ))
        return
    if 'sqlite' not in DATABASE_URL:
        return
    db_path = DATABASE_URL.replace('sqlite:///./', './').replace('sqlite:///', '').replace('sqlite://', '')
    if not db_path or db_path.startswith('file:') or not os.path.exists(db_path):
        return
    try:
        with sqlite3.connect(db_path) as conn:
            columns = {row[1] for row in conn.execute("PRAGMA table_info(event_flyers)").fetchall()}
            if 'registration_url' not in columns:
                conn.execute('ALTER TABLE event_flyers ADD COLUMN registration_url VARCHAR')
    except Exception:
        pass


def ensure_event_workflow_columns():
    columns_by_table = {
        "event_flyers": {
            "event_end_date": "VARCHAR",
        },
        "event_registrations": {
            "registration_screenshot_path": "VARCHAR",
            "verification_status": "VARCHAR DEFAULT 'pending'",
            "verified_at": "DATETIME",
            "verified_by": "VARCHAR",
            "rejection_reason": "VARCHAR",
            "certificate_upload_path": "VARCHAR",
            "certificate_uploaded_at": "DATETIME",
            "reminder_sent_at": "DATETIME",
        },
    }
    if "postgresql" in DATABASE_URL:
        postgres_columns = {
            "event_flyers": {
                "event_end_date": "VARCHAR",
            },
            "event_registrations": {
                "registration_screenshot_path": "VARCHAR",
                "verification_status": "VARCHAR DEFAULT 'pending'",
                "verified_at": "TIMESTAMP WITH TIME ZONE",
                "verified_by": "VARCHAR",
                "rejection_reason": "VARCHAR",
                "certificate_upload_path": "VARCHAR",
                "certificate_uploaded_at": "TIMESTAMP WITH TIME ZONE",
                "reminder_sent_at": "TIMESTAMP WITH TIME ZONE",
            },
            "students": {
                "reg_no": "VARCHAR",
                "last_name": "VARCHAR",
                "gender": "VARCHAR",
                "dob": "VARCHAR",
                "blood_group": "VARCHAR",
                "mobile_number": "VARCHAR",
                "email": "VARCHAR",
                "year": "VARCHAR DEFAULT 'I'",
                "department": "VARCHAR DEFAULT 'AI & DS'",
                "section": "VARCHAR",
                "photo_path": "VARCHAR",
                "total_points": "INTEGER DEFAULT 0",
                "total_events": "INTEGER DEFAULT 0",
                "current_badge": "VARCHAR",
                "updated_at": "TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP",
            },
        }
        with engine.begin() as conn:
            for table, columns in postgres_columns.items():
                for name, definition in columns.items():
                    conn.execute(text(
                        f"ALTER TABLE {table} ADD COLUMN IF NOT EXISTS {name} {definition}"
                    ))
        return
    if "sqlite" not in DATABASE_URL:
        return
    db_path = DATABASE_URL.replace("sqlite:///./", "./").replace("sqlite:///", "").replace("sqlite://", "")
    if not db_path or db_path.startswith("file:") or not os.path.exists(db_path):
        return
    try:
        with sqlite3.connect(db_path) as conn:
            for table, columns in columns_by_table.items():
                existing = {row[1] for row in conn.execute(f"PRAGMA table_info({table})").fetchall()}
                for name, definition in columns.items():
                    if name not in existing:
                        conn.execute(f"ALTER TABLE {table} ADD COLUMN {name} {definition}")
    except Exception:
        pass


def ensure_achievement_college_name_column():
    if 'postgresql' in DATABASE_URL:
        with engine.begin() as conn:
            conn.execute(text(
                "ALTER TABLE achievements ADD COLUMN IF NOT EXISTS college_name VARCHAR"
            ))
        return
    if 'sqlite' not in DATABASE_URL:
        return
    db_path = DATABASE_URL.replace('sqlite:///./', './').replace('sqlite:///', '').replace('sqlite://', '')
    if not db_path or db_path.startswith('file:') or not os.path.exists(db_path):
        return
    try:
        with sqlite3.connect(db_path) as conn:
            columns = {row[1] for row in conn.execute("PRAGMA table_info(achievements)").fetchall()}
            if 'college_name' not in columns:
                conn.execute('ALTER TABLE achievements ADD COLUMN college_name VARCHAR')
    except Exception:
        pass


def normalize_legacy_password_hashes():
    try:
        from .database import SessionLocal
        from .auth import hash_password

        db = SessionLocal()
        for model in (models.AdminUser, models.StaffUser):
            for user in db.query(model).all():
                if not user.hashed_password:
                    continue
                if user.hashed_password.startswith("$"):
                    continue
                user.hashed_password = hash_password(user.hashed_password)
        db.commit()
        db.close()
    except Exception:
        pass


ensure_sqlite_roll_no_index_is_not_unique()
ensure_event_flyer_event_type_column()
ensure_event_flyer_registration_url_column()
ensure_event_workflow_columns()
ensure_achievement_college_name_column()
models.Base.metadata.create_all(bind=engine)
normalize_legacy_password_hashes()

app = FastAPI(title="Student Achievement Portal API")
logger = logging.getLogger(__name__)

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_methods=["*"],
    allow_headers=["*"],
)

app.mount("/static", StaticFiles(directory="app/static"), name="static")

app.include_router(auth.router)
app.include_router(students.router)
app.include_router(achievements.router)
app.include_router(dashboard.router)
app.include_router(events.router)
app.include_router(certificates.router)
app.include_router(import_data.router)
app.include_router(notifications.router)
app.include_router(event_flyers.router)
app.include_router(gamification.router)
app.include_router(registrations.router)


async def certificate_reminder_loop():
    while True:
        try:
            from .database import SessionLocal
            db = SessionLocal()
            registrations.send_due_certificate_reminders(db)
            db.close()
        except Exception:
            logger.exception("Certificate reminder check failed")
        await asyncio.sleep(3600)


@app.on_event("startup")
async def start_certificate_reminder_loop():
    asyncio.create_task(certificate_reminder_loop())


@app.get("/")
def root():
    return {"message": "Student Achievement Portal API is running"}
