import os
import smtplib
from email.message import EmailMessage


def send_achievement_reminder(recipient: str, student_name: str, achievement_count: int, minimum: int) -> None:
    """Send one achievement-target reminder using the configured SMTP provider."""
    host = os.getenv("SMTP_HOST")
    sender = os.getenv("SMTP_FROM") or os.getenv("SMTP_USERNAME")
    password = os.getenv("SMTP_PASSWORD")
    port = int(os.getenv("SMTP_PORT", "587"))

    if not host or not sender or not password:
        raise RuntimeError(
            "Email is not configured. Set SMTP_HOST, SMTP_USERNAME, SMTP_PASSWORD, and SMTP_FROM."
        )

    missing = max(minimum - achievement_count, 0)
    message = EmailMessage()
    message["Subject"] = "Achievement target reminder"
    message["From"] = sender
    message["To"] = recipient
    message.set_content(
        f"Dear {student_name},\n\n"
        f"You currently have {achievement_count} recorded achievement(s). "
        f"Your target is {minimum}, so you need {missing} more to reach it.\n\n"
        "Please take part in eligible activities and ensure your achievements are submitted to the department.\n\n"
        "Regards,\nStudent Achievement Portal"
    )

    with smtplib.SMTP(host, port, timeout=20) as smtp:
        smtp.ehlo()
        if os.getenv("SMTP_USE_TLS", "true").lower() not in {"false", "0", "no"}:
            smtp.starttls()
            smtp.ehlo()
        smtp.login(os.getenv("SMTP_USERNAME", sender), password)
        smtp.send_message(message)
