import argparse
import os
import sys

from dotenv import load_dotenv
from sqlalchemy import create_engine
from sqlalchemy.orm import Session, sessionmaker

sys.path.append(os.path.dirname(__file__))

from app import models  # noqa: F401
from app.database import Base

load_dotenv()


def parse_args() -> argparse.Namespace:
    parser = argparse.ArgumentParser(description="Migrate local app data to Supabase.")
    parser.add_argument(
        "--db-url",
        default=os.getenv("SUPABASE_DB_URL"),
        help="Supabase Postgres URL. Can also be set with SUPABASE_DB_URL.",
    )
    parser.add_argument(
        "--full-database",
        action="store_true",
        help="Run the full database migration instead of photo-only mode.",
    )
    return parser.parse_args()


def migrate_full_database(session: Session) -> None:
    """Placeholder for a full migration of non-photo data."""
    print("Full database migration is not implemented yet.")


def migrate_photos(session: Session) -> None:
    """Placeholder for photo migration logic."""
    print("Photo migration is not implemented yet.")


def main() -> None:
    args = parse_args()
    supabase_db_url = args.db_url

    if not supabase_db_url:
        raise SystemExit(
            "Supabase database URL is missing. Set SUPABASE_DB_URL or pass --db-url."
        )

    engine = create_engine(supabase_db_url, pool_pre_ping=True)
    Base.metadata.create_all(bind=engine)
    PgSession = sessionmaker(bind=engine)

    with PgSession() as pg_db:
        if args.full_database:
            migrate_full_database(pg_db)
        else:
            print("Photo-only mode: existing Supabase student records will not be changed.")

        migrate_photos(pg_db)

    print("Migration complete!")


if __name__ == "__main__":
    main()
