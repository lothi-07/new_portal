import argparse
import os
import sqlite3
import sys

from dotenv import load_dotenv
from sqlalchemy import create_engine
from sqlalchemy.orm import sessionmaker

sys.path.append(os.path.dirname(__file__))

from app import models
from app.database import Base
from app import models

SUPABASE_DB_URL = "YOUR_SUPABASE_DB_URL"

pg_engine = create_engine(SUPABASE_DB_URL, pool_pre_ping=True)
Base.metadata.create_all(bind=pg_engine)
PgSession = sessionmaker(bind=pg_engine)
pg_db = PgSession()

try:
    if args.full_database:
        migrate_full_database(pg_db)
    else:
        print("Photo-only mode: existing Supabase student records will not be changed.")
    migrate_photos(pg_db)
finally:
    pg_db.close()

print("Migration complete!")
