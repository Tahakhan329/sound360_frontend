from passlib.hash import sha256_crypt
import jwt
from datetime import datetime, timedelta, timezone
from config import SECRET_KEY, PERMISSIONS
import random
import string
import json
from fastapi import HTTPException, status
from sqlalchemy.orm import Session
import logging

logger = logging.getLogger(__name__)

async def hash_password(password: str) -> str:
    return sha256_crypt.hash(password)


async def generate_temp_password(length: int = 12) -> str:
    chars = string.ascii_letters + string.digits
    return ''.join(random.choice(chars) for _ in range(length))


async def verify_password(password: str, password_hash: str) -> bool:
    return sha256_crypt.verify(password, password_hash)


async def create_jwt(user_id, username, role, expires_in_hrs=12, SECRET_KEY=SECRET_KEY, ALGORITHM="HS256"):
    payload = {
        "user_id": user_id,
        "username": username,
        "role": role,
        "exp": datetime.now(timezone.utc) + timedelta(hours=expires_in_hrs),
        "iat": datetime.now(timezone.utc),
    }
    return jwt.encode(payload, SECRET_KEY, algorithm=ALGORITHM)


async def decode_token(token: str) -> dict:
    try:
        payload = jwt.decode(token, options={"verify_signature": False})
        return payload

    except jwt.ExpiredSignatureError:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Token has expired."
        )

    except jwt.InvalidTokenError:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Invalid token."
        )


async def generate_otp(length=6):
    chars = string.ascii_letters + string.digits
    return "".join(random.choice(chars) for _ in range(length))


async def permissions(file=PERMISSIONS):

    with open(file, "r") as f:
        permissions = json.load(f)

    return permissions

