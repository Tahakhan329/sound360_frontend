import os
from dotenv import load_dotenv
from sqlalchemy import create_engine
from sqlalchemy.orm import sessionmaker, declarative_base

load_dotenv()


HF_TOKEN = os.getenv("HF_TOKEN")
DATABASE_URL = os.getenv("DATABASE_URL")
SECRET_KEY = os.getenv("APP_SECRET_KEY")

ADMIN = {
    "first_name": os.getenv("ADMIN_FIRST_NAME"),
    "last_name": os.getenv("ADMIN_LAST_NAME"),
    "username": os.getenv("ADMIN_USERNAME"),
    "email": os.getenv("ADMIN_EMAIL"),
    "password": os.getenv("ADMIN_PASSWORD"),
    "role": os.getenv("ADMIN_ROLE"),
}

PERMISSIONS = os.getenv("PERMISSIONS")


engine = create_engine(DATABASE_URL, echo=False)
SessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)

Base = declarative_base()

smtp_port = os.getenv("SMTP_PORT")
smtp_server = os.getenv("SMTP_SERVER")
source_mail = os.getenv("SOURCE_MAIL")
smtp_password = os.getenv("SMTP_PASSWORD")
