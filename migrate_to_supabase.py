import sqlite3, sys, os
sys.path.append(os.path.dirname(__file__))
from sqlalchemy import create_engine
from sqlalchemy.orm import sessionmaker
from app.database import Base
from app import models

SUPABASE_DB_URL = "postgresql://your_supabase_db_url.supabase.com:6543/postgres"

pg_engine = create_engine(SUPABASE_DB_URL, pool_pre_ping=True)
Base.metadata.create_all(bind=pg_engine)
PgSession = sessionmaker(bind=pg_engine)
pg_db = PgSession()

sqlite_conn = sqlite3.connect("achievement_portal.db")
sqlite_conn.row_factory = sqlite3.Row

print("Migrating admin_users...")
admins = [dict(row) for row in sqlite_conn.execute("SELECT * FROM admin_users")]
pg_db.bulk_insert_mappings(models.AdminUser, admins)
pg_db.commit()
print(f"  {len(admins)} done")

print("Migrating students...")
students = [dict(row) for row in sqlite_conn.execute("SELECT * FROM students")]
pg_db.bulk_insert_mappings(models.Student, students)
pg_db.commit()
print(f"  {len(students)} done")

print("Migrating achievements...")
achievements = [dict(row) for row in sqlite_conn.execute("SELECT * FROM achievements")]
pg_db.bulk_insert_mappings(models.Achievement, achievements)
pg_db.commit()
print(f"  {len(achievements)} done")

print("Migration complete!")
