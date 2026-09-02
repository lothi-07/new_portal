import sys, os
sys.path.append(os.path.dirname(__file__))

from app.database import SessionLocal, engine, Base
from app import models
from app.auth import hash_password

Base.metadata.create_all(bind=engine)
db = SessionLocal()

# ---- 1. Default admin account ----
DEFAULT_EMAIL = "your mail id"
DEFAULT_PASSWORD = "your password"   # CHANGE THIS after first login

existing_admin = db.query(models.AdminUser).filter(models.AdminUser.email == DEFAULT_EMAIL).first()
if not existing_admin:
    admin = models.AdminUser(
        email=DEFAULT_EMAIL,
        hashed_password=hash_password(DEFAULT_PASSWORD),
        name="Admin",
    )
    db.add(admin)
    db.commit()
    print(f"Created default admin login:\n  email:    {DEFAULT_EMAIL}\n  password: {DEFAULT_PASSWORD}")
else:
    print("Default admin already exists.")

db.close()
print("Database ready.")
