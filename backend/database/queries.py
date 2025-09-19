from sqlalchemy.orm import Session
from config import ADMIN
from utils import security, smtp_setup
from datetime import datetime, timedelta, timezone
import asyncio
from models import User, AdminVerification, VerificationStatus, PasswordResetOTP, ActiveUsers, CallAnalysis
from fastapi import HTTPException
from sqlalchemy import or_
import logging
import json

logger = logging.getLogger(__name__)





def signup(db: Session, first_name, last_name, username, email, password, role="agent", auto_verify=False):
    if role == ADMIN["role"]:
        exists = db.query(User).filter(User.role == ADMIN["role"]).first()
        if exists:
            return {"error": "Admin already exists. Cannot create another."}
        auto_verify = True

    if db.query(User).filter((User.username == username) | (User.email == email)).first():
        return {"error": "User already exists."}

    if len(password) < 8:
        return {"error": "Required atleast 8 characters in a password."}

    hashed_password = asyncio.run(security.hash_password(password))

    user = User(
        first_name=first_name,
        last_name=last_name,
        username=username,
        email=email,
        password_hash=hashed_password,
        role=role,
        is_verified=auto_verify,
    )
    db.add(user)
    db.commit()
    db.refresh(user)

    if role != ADMIN["role"]:
        verification = AdminVerification(
            user_id=user.id, verified_flag=VerificationStatus.pending
        )
        db.add(verification)
        db.commit()

    return {
        "message": "Signup successful. Awaiting admin verification.",
        "username": user.username
    }


async def signin(db: Session, username_or_email, password):
    user = db.query(User).filter(
        (User.username == username_or_email) | (
            User.email == username_or_email)
    ).first()

    if not user or not await security.verify_password(password, user.password_hash):
        return {"error": "Invalid username/email or password"}

    if not user.is_verified and user.role != ADMIN["role"]:
        return {"error": "Account not yet verified by admin or manager."}

    token = await security.create_jwt(user.id, user.username, user.role)

    expiry_time = datetime.now(timezone.utc) + timedelta(days=30)

    active_session = ActiveUsers(
        user_id=user.id,
        username=user.username,
        role=user.role,
        bearer_token=token,
        bearer_expiry_time=expiry_time
    )
    db.add(active_session)
    db.commit()
    db.refresh(active_session)

    return {
        "message": "Signin successful",
        "token": token,
        "role": user.role,
        "expiry": expiry_time.isoformat()
    }


async def update_user_verification(db: Session, username: str, verified: bool, verified_by: str):
    user = db.query(User).filter(User.username == username).first()
    if not user:
        return {"error": f"User '{username}' not found."}
    user_role = user.role

    admin = db.query(User).filter(User.username == verified_by).first()
    if not admin:
        return {"error": f"Verifier '{verified_by}' not found."}

    if admin.role not in ["admin", "manager"]:
        return {"error": f"Verifier '{verified_by}' is not an admin/manager."}

    if not admin.is_verified:
        return {"error": f"Verifier '{verified_by}' is not a verified admin/manager."}

    if admin.role == "manager" and user_role != "agent":
        return {"error": f"Manager '{verified_by}' is not allowed to verify '{user_role}' users."}

    user.is_verified = verified
    db.commit()

    verification = db.query(AdminVerification).filter_by(
        user_id=user.id).first()
    if not verification:
        return {"error": f"User '{username}' not found in Admin_Verification table."}

    verification.verified_flag = (
        VerificationStatus.approved if verified else VerificationStatus.rejected
    )
    verification.verified_by = verified_by
    db.commit()

    return {
        "message": (
            f"User '{username}' ({user_role}) has been "
            f"{'approved' if verified else 'rejected'} by {verified_by} ({admin.role})."
        )
    }


async def forgot_password_request(db: Session, username_or_email: str):
    user = db.query(User).filter(
        (User.username == username_or_email) | (
            User.email == username_or_email)
    ).first()
    if not user:
        return {"error": "User not found."}

    if not user.is_verified:
        return {"error": f"Account '{user.email}' is not verified yet. Cannot reset password."}

    db.query(PasswordResetOTP).filter(
        PasswordResetOTP.user_id == user.id,
        PasswordResetOTP.expires_at > datetime.now(timezone.utc),
        PasswordResetOTP.used_once == False
    ).update(
        {PasswordResetOTP.expires_at: datetime.now(timezone.utc)},
        synchronize_session=False
    )

    otp_code = await security.generate_otp()
    otp_exp_time = 5
    otp_entry = PasswordResetOTP(
        user_id=user.id,
        otp_code=otp_code,
        expires_at=datetime.now(timezone.utc) + timedelta(minutes=otp_exp_time)
    )

    db.add(otp_entry)
    db.commit()
    db.refresh(otp_entry)

    email_status = await smtp_setup.send_email(
        user.email,
        "Forgot Password Request",
        f"There's a request to reset the password of your account. Kindly confirm the OTP. Your OTP is {otp_code}."
    )

    if email_status:
        return {"message": f"OTP sent to {user.email}. It will expire in {otp_exp_time} minutes."}
    else:
        return {"error": f"Failed to send OTP email to {user.email}."}


async def verify_otp(db: Session, username_or_email: str, otp: str):
    user = db.query(User).filter(
        (User.username == username_or_email) | (User.email == username_or_email)
    ).first()
    if not user:
        return {"error": "Username not found."}

    if not user.is_verified:
        return {"error": f"Account '{user.email}' is not verified yet. Cannot reset password."}

    otp_entry = (
        db.query(PasswordResetOTP)
        .filter(
            PasswordResetOTP.user_id == user.id,
            PasswordResetOTP.otp_code == otp
        )
        .order_by(PasswordResetOTP.created_at.desc())
        .first()
    )

    if not otp_entry:
        return {"error": "Invalid OTP."}

    if otp_entry.used_once:
        return {"error": "OTP already used. Please request a new one."}

    if otp_entry.expires_at <= datetime.now(timezone.utc):
        return {"error": "OTP expired. Please request a new one."}

    otp_entry.used_once = True
    db.commit()

    temp_password = await security.generate_temp_password()
    user.password_hash = await security.hash_password(temp_password)
    db.commit()

    token = await security.create_jwt(user.id, user.username, user.role)
    temp_time = 5
    expiry_time = datetime.now(timezone.utc) + timedelta(minutes=temp_time)

    db.query(ActiveUsers).filter(ActiveUsers.user_id == user.id).delete()

    active_session = ActiveUsers(
        user_id=user.id,
        username=user.username,
        role=user.role,
        bearer_token=token,
        bearer_expiry_time=expiry_time
    )
    db.add(active_session)
    db.commit()
    db.refresh(active_session)

    return {
        "message": "OTP verified successfully. Use temp password to login and change password.",
        "token": token,
        "temp_password": temp_password,
        "expires_in_minutes": temp_time
    }


async def verify_bearer_token(db: Session, token: str):

    latest_session = (
        db.query(ActiveUsers)
        .filter(ActiveUsers.bearer_token == token)
        .order_by(ActiveUsers.created_at.desc())
        .first()
    )

    if not latest_session:
        return {"error": "Invalid or expired token."}

    if latest_session.bearer_expiry_time <= datetime.now(timezone.utc):
        return {"error": "Token expired."}

    return {
        "message": "Token is valid.",
        "user_id": latest_session.user_id,
        "username": latest_session.username,
        "role": latest_session.role,
    }


async def change_password(db: Session, username_or_email: str, current_password: str, new_password: str):
    user = db.query(User).filter(
        (User.username == username_or_email) | (
            User.email == username_or_email)
    ).first()

    if not user:
        return {"error": "User not found."}

    if not await security.verify_password(current_password, user.password_hash):
        return {"error": "Current password is incorrect."}

    if len(new_password) < 8:
        return {"error": "Password must be at least 8 characters long."}

    user.password_hash = await security.hash_password(new_password)
    db.commit()
    return {"message": "Password updated successfully."}


async def remove_user(db: Session, current_user_id: int, current_user_role: str, username_or_email: str):
    current_user = db.query(User).filter(User.username == current_user_id).first()
    if not current_user:
        return {"error": "Current user not found."}

    target_user = db.query(User).filter(
        (User.username == username_or_email) | (User.email == username_or_email)
    ).first()

    if not target_user:
        return {"error": "User not found."}

    if current_user.id == target_user.id:
        return {"error": "You cannot remove yourself."}

    current_role = current_user_role
    target_role = target_user.role

    if current_role == "agent":
        return {"error": f"Agent '{current_user.username}' is not allowed to remove any user."}

    if current_role == "manager" and target_role != "agent":
        return {"error": f"Manager '{current_user.username}' is not allowed to remove '{target_role}' users."}

    if current_role == "admin" and target_role == "admin":
        return {"error": "Admin users cannot remove other admins."}

    db.delete(target_user)
    db.commit()

    return {"message": f"User '{target_user.username}' has been removed successfully."}


async def add_voice_sample(db: Session, username: str, file_path: str):
    """
    Save the audio file path against the given user_id in DB.
    """
    user = db.query(User).filter(User.username == username).first()
    if not user:
        raise HTTPException(status_code=404, detail="User not found")

    try:
        user.voice_sample_path = file_path 
        db.commit()
        db.refresh(user)

        return {"message": f"Voice sample saved for user '{user.username}'", "voice_path": file_path}
    except Exception as e:
        db.rollback()
        raise HTTPException(status_code=500, detail=f"Failed to save voice sample: {str(e)}")
    

async def get_verified_users(db: Session, requester_role: str):
    try:
        query = (
            db.query(
                User.id,
                User.first_name,
                User.last_name,
                User.username,
                User.email,
                User.role,
                User.voice_sample_path,
                AdminVerification.verified_flag,
            )
            .join(AdminVerification, AdminVerification.user_id == User.id)
            .filter(
                or_(
                    AdminVerification.verified_flag == VerificationStatus.pending,
                    AdminVerification.verified_flag == VerificationStatus.approved,
                )
            )
        )

        if requester_role == "manager":
            query = query.filter(User.role == "agent")
        elif requester_role == "admin":
            query = query.filter(User.role.in_(["agent", "manager"]))
        else:
            return {"error": f"Role '{requester_role}' is not allowed to view users."}

        results = query.all()

        return [
            {
                "user_id": r.id,
                "first_name": r.first_name,
                "last_name": r.last_name,
                "username": r.username,
                "email": r.email,
                "role": r.role,
                "voice_sample_path": r.voice_sample_path,
                "verification_status": r.verified_flag.value if hasattr(r.verified_flag, "value") else r.verified_flag,
            }
            for r in results
        ]

    except Exception as e:
        logger.exception("Error fetching verified users")
        return {"error": f"Unexpected error: {str(e)}"}


async def save_call_analysis(db: Session, user_id: int, call_id: str, analysis_result: dict):
    try:
        agent_dialogs_transcriptions = []
        cx_dialogs_transcriptions = []

        for segment in analysis_result['segments']:
            agent_dialogs = segment.get('agent', [])
            cx_dialogs = segment.get('customer', [])

            if agent_dialogs:
                agent_dialogs_transcriptions.extend(agent_dialogs)
            if cx_dialogs:
                cx_dialogs_transcriptions.extend(cx_dialogs)

        cx_sentiment_result = analysis_result.get('cx_sentiment_result', {})
        positive_sentiment_percentage = float(cx_sentiment_result.get("positive", "0.0%").strip('%'))
        negative_sentiment_percentage = float(cx_sentiment_result.get("negative", "0.0%").strip('%'))
        neutral_sentiment_percentage = float(cx_sentiment_result.get("neutral", "0.0%").strip('%'))

        sentiments = {
            "positive": positive_sentiment_percentage,
            "negative": negative_sentiment_percentage,
            "neutral": neutral_sentiment_percentage
        }

        max_sentiment_type = max(sentiments, key=sentiments.get)

        new_analysis = CallAnalysis(
            user_id=user_id,
            call_id=call_id,
            agent_dialogs=json.dumps(agent_dialogs_transcriptions),
            customer_dialogs=json.dumps(cx_dialogs_transcriptions), 
            cx_neutral_percentage=neutral_sentiment_percentage,
            cx_positive_percentage=positive_sentiment_percentage,
            cx_negative_percentage=negative_sentiment_percentage,
            overall_call_sentiment=max_sentiment_type
        )

        db.add(new_analysis)
        db.commit()
        db.refresh(new_analysis)
        return new_analysis

    except Exception as e:
        db.rollback()
        raise HTTPException(status_code=500, detail=f"Failed to save analysis result: {str(e)}")