"""
Uploads student photos to Supabase Storage so they survive server
restarts/redeploys. Falls back gracefully if Supabase isn't configured.
"""
import os
from dotenv import load_dotenv
from storage3.exceptions import StorageApiError

load_dotenv()

SUPABASE_URL = os.getenv("SUPABASE_URL")
SUPABASE_KEY = os.getenv("SUPABASE_SERVICE_ROLE_KEY") or os.getenv("SUPABASE_KEY")
BUCKET_NAME = os.getenv("STUDENT_PHOTOS_BUCKET", "student-photos")

_supabase_client = None


def _get_client():
    global _supabase_client
    if _supabase_client is not None:
        return _supabase_client
    if not SUPABASE_URL or not SUPABASE_KEY:
        return None
    from supabase import create_client
    _supabase_client = create_client(SUPABASE_URL, SUPABASE_KEY)
    return _supabase_client


def _bucket_missing(exc: StorageApiError) -> bool:
    code = str(getattr(exc, "code", "")).lower()
    status = str(getattr(exc, "status", "")).lower()
    message = str(getattr(exc, "message", "")).lower()
    return "bucket" in code or "bucket" in message or "not found" in message or "404" in status


def _ensure_bucket_exists(client):
    try:
        client.storage.get_bucket(BUCKET_NAME)
        return
    except StorageApiError as exc:
        if not _bucket_missing(exc):
            raise

    try:
        client.storage.create_bucket(BUCKET_NAME, name=BUCKET_NAME, options={"public": True})
    except StorageApiError as exc:
        raise RuntimeError(
            f"Supabase bucket '{BUCKET_NAME}' does not exist and could not be created. "
            "Create it manually in Supabase Storage > New bucket, or set STUDENT_PHOTOS_BUCKET to the correct bucket name."
        ) from exc


def upload_photo_bytes(file_bytes: bytes, filename: str) -> str:
    client = _get_client()
    if client is None:
        raise RuntimeError("Supabase not configured. Set SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY in .env")

    try:
        client.storage.from_(BUCKET_NAME).upload(
            filename, file_bytes, {"upsert": "true", "content-type": "image/jpeg"}
        )
    except StorageApiError as exc:
        if _bucket_missing(exc):
            _ensure_bucket_exists(client)
            client.storage.from_(BUCKET_NAME).upload(
                filename, file_bytes, {"upsert": "true", "content-type": "image/jpeg"}
            )
        else:
            raise

    return client.storage.from_(BUCKET_NAME).get_public_url(filename)


def public_photo_url(photo_path: str | None, roll_no: str | None = None) -> str | None:
    """Return the student's photo URL.

    IMPORTANT: if we already have a full Supabase URL stored (set at upload
    time in students.py / import_data.py), we return it AS-IS. We used to
    re-guess the filename as "{roll_no}.jpg" here, which silently returned a
    URL for students who never uploaded a photo at all, and broke photos for
    anyone whose uploaded file wasn't exactly a lowercase ".jpg" (e.g. a
    phone photo saved as .JPG or .PNG) — since the guess always assumed
    lowercase ".jpg" and never fell through to try the others. The stored
    photo_path is always correct, so there's no need to guess.
    """
    if not photo_path:
        return None
    if photo_path.startswith(("http://", "https://")):
        return photo_path
    if photo_path.startswith("/static/photos/"):
        filename = photo_path.removeprefix("/static/photos/")
        client = _get_client()
        if client is not None and filename:
            return client.storage.from_(BUCKET_NAME).get_public_url(filename)
    normalized_path = photo_path.replace("\\", "/")
    marker = "/static/photos/"
    if marker in normalized_path:
        filename = normalized_path.split(marker, 1)[1]
        client = _get_client()
        if client is not None and filename:
            return client.storage.from_(BUCKET_NAME).get_public_url(filename)
    return photo_path