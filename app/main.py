from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from fastapi.staticfiles import StaticFiles
import os
import sqlite3

from . import models
from .database import engine, DATABASE_URL
from .routers import students, achievements, dashboard, events, certificates, import_data, auth, notifications, event_flyers


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
models.Base.metadata.create_all(bind=engine)
normalize_legacy_password_hashes()

app = FastAPI(title="Student Achievement Portal API")

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


@app.get("/")
def root():
    return {"message": "Student Achievement Portal API is running"}
