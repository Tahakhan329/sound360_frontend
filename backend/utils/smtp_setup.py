import re
from email.mime.text import MIMEText
from email.mime.multipart import MIMEMultipart
from aiosmtplib import SMTP, SMTPException
from config import smtp_port, smtp_server, source_mail, smtp_password


async def is_valid_email(email: str) -> bool:
    """Validate email address using regex."""
    pattern = r"^[a-zA-Z0-9_.+-]+@[a-zA-Z0-9-]+\.[a-zA-Z0-9-.]+$"
    return re.match(pattern, email) is not None


async def send_email(receiver_email: str, subject: str, body: str) -> bool:
    """Send an email asynchronously using aiosmtplib with validation."""

    if not await is_valid_email(receiver_email):
        print(f"Invalid email address: {receiver_email}")
        return False

    if not subject.strip():
        print("Email subject cannot be empty.")
        return False

    if not body.strip():
        print("Email body cannot be empty.")
        return False

    msg = MIMEMultipart()
    msg["From"] = source_mail
    msg["To"] = receiver_email
    msg["Subject"] = subject
    msg.attach(MIMEText(body, "plain"))

    try:
        smtp = SMTP(hostname=smtp_server, port=int(smtp_port), use_tls=False)

        await smtp.connect()
        await smtp.login(source_mail, smtp_password)
        await smtp.send_message(msg)

        await smtp.quit()

        print(f"OTP successfully sent to {receiver_email}")
        return True

    except SMTPException as smtp_err:
        print(f"SMTP error: {smtp_err}")
    except Exception as e:
        print(f"Unexpected error: {e}")

    return False
