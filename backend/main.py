import os
from datetime import datetime
from utils.security import permissions, decode_token
from contextlib import asynccontextmanager

import asyncio
from fastapi import (
    FastAPI,
    WebSocket,
    WebSocketDisconnect,
    HTTPException,
    Request,
    Header,
    APIRouter,
    Depends
)
from fastapi.middleware.cors import CORSMiddleware
from fastapi.staticfiles import StaticFiles

from sqlalchemy.orm import Session
from models import User
from database.queries import (signup, signin, update_user_verification, forgot_password_request, 
                              verify_otp, verify_bearer_token, change_password, remove_user, 
                              add_voice_sample, get_verified_users, save_call_analysis)

from config import SessionLocal


# from fastapi.responses import HTMLResponse, FileResponse
from fastapi.responses import StreamingResponse

import json
import logging

import uuid
from typing import List, Dict
import uuid
from pydantic import BaseModel
from typing import Optional



# ============== MY IMPORTS...
from voice_processor import VoiceProcessor, SentimentAnalyzer 
# from voice_processor import SentimentAnalyzer
from voice_registration import UserVoiceRegistration, UserVoiceProcessing


logging.basicConfig(
    level=logging.INFO,
    format="%(asctime)s - %(name)s - %(levelname)s - %(message)s",
    handlers=[logging.FileHandler("sound360.log"), logging.StreamHandler()],
)

logger = logging.getLogger(__name__)


RBAC_PERMISSIONS = None


@asynccontextmanager
async def lifespan(app: FastAPI):
    global RBAC_PERMISSIONS
    RBAC_PERMISSIONS = await permissions()
    logger.info("RBAC permissions loaded at startup.")
    yield
    logger.info("Shutting down Sound360 API...")


app = FastAPI(
    title="Sound360 Customer Service API",
    description="Production-Ready AI Voice Assistant for Customer Service",
    version="1.0.0",
    # docs_url="/api/docs",
    redoc_url="/api/redoc",
    lifespan=lifespan

)

router = APIRouter()

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],  # Configure specific origins in production
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)


os.makedirs("agents_audios", exist_ok=True)
app.mount("/static", StaticFiles(directory="agents_audios"), name="static")


# WILL MUTE THIS WHEN DEPLOYED TO SERVER.. (USED THIS JUST BECAUSE OF WINDOWS OPERATING SYSTEM)
# ffmpeg_path = os.path.abspath("ffmpeg/bin")
# os.environ["PATH"] = ffmpeg_path + os.pathsep + os.environ.get("PATH", "")


class ProductionConnectionManager:
    def __init__(self):
        self.active_connections: List[WebSocket] = []
        self.client_sessions: Dict[WebSocket, str] = {}
        self.customer_info: Dict[str, Dict] = {}

    async def connect(
        self, websocket: WebSocket, session_id: str, customer_info: Dict = None
    ):
        # await websocket.accept()
        self.active_connections.append(websocket)
        self.client_sessions[websocket] = session_id
        if customer_info:
            self.customer_info[session_id] = customer_info

        logger.info(f"Customer connected: {session_id}")

    def disconnect(self, websocket: WebSocket):
        if websocket in self.active_connections:
            self.active_connections.remove(websocket)
            session_id = self.client_sessions.pop(websocket, "unknown")
            self.customer_info.pop(session_id, None)
            logger.info(f"Customer disconnected: {session_id}")
            voice_processor.clear_session_memory(session_id)

    async def send_personal_message(self, message: str, websocket: WebSocket):
        try:
            await websocket.send_text(message)
        except Exception as e:
            logger.error(f"Error sending message: {e}")

    async def send_data(self, message: dict, session_id: str):
        try:
            websocket = None
            for ws, sid in self.client_sessions.items():
                if sid == session_id:
                    websocket = ws
                    break

            if websocket:
                await websocket.send_text(json.dumps(message))
            else:
                logger.warning(
                    f"No active websocket for session_id: {session_id}")

        except Exception as e:
            logger.error(
                f"Error sending transcription for session_id={session_id}: {e}",
                exc_info=True,
            )

    async def broadcast_to_admins(self, message: str):
        # Broadcast to admin connections only
        for connection in self.active_connections:
            try:
                await connection.send_text(message)
            except:
                pass


manager = ProductionConnectionManager()
voice_processor = VoiceProcessor(send_message=manager.send_data)


def get_db():
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()


async def validate_bearer_token(authorization: str, db: Session):
    if not authorization or not authorization.startswith("Bearer "):
        raise HTTPException(
            status_code=401, detail="Missing or invalid Authorization header")

    token = authorization.split(" ")[1]
    try:
        token_data = await decode_token(token)
    except Exception as e:
        logger.warning(f"Token decode failed: {str(e)}")
        raise HTTPException(status_code=401, detail="Invalid token")

    verification = await verify_bearer_token(db, token)
    if "error" in verification:
        raise HTTPException(status_code=401, detail=verification["error"])

    return token_data, verification



@app.post("/api/signup")
async def register_user(request: Request, db: Session = Depends(get_db)):
    try:
        try:
            data = await request.json()
        except Exception:
            raise HTTPException(status_code=400, detail="Invalid JSON payload")

        required_fields = ["first_name", "last_name",
                           "username", "email", "password"]
        missing = [f for f in required_fields if not data.get(f)]
        if missing:
            raise HTTPException(
                status_code=400, detail=f"Missing required fields: {', '.join(missing)}")

        status = await asyncio.to_thread(
            signup,
            db,
            data["first_name"],
            data["last_name"],
            data["username"],
            data["email"],
            data["password"],
            data.get("role", "agent")
        )

        if "error" in status:
            raise HTTPException(status_code=400, detail=status["error"])

        return {"message": "User registered successfully", **status}

    except HTTPException:
        raise
    except Exception as e:
        logger.exception("Unexpected error during signup")
        raise HTTPException(status_code=500, detail="Unexpected server error")


@app.post("/api/signin")
async def login(request: Request, db: Session = Depends(get_db)):
    try:
        try:
            data = await request.json()
        except Exception:
            raise HTTPException(status_code=400, detail="Invalid JSON payload")

        username_or_email = data.get("username_or_email")
        password = data.get("password")

        if not username_or_email or not password:
            raise HTTPException(
                status_code=400, detail="Missing username/email or password")

        status = await signin(db=db, username_or_email=username_or_email, password=password)

        if "error" in status:
            raise HTTPException(status_code=401, detail=status["error"])

        return {"message": "Signin successful", **status}

    except HTTPException:
        raise
    except Exception as e:
        logger.exception("Unexpected error during signin")
        raise HTTPException(status_code=500, detail="Unexpected server error")


@app.post("/api/update_user_verification")
async def verify_user(
    request: Request,
    authorization: str = Header(None),
    db: Session = Depends(get_db)
):
    try:
        token_data, _ = await validate_bearer_token(authorization, db)
        username = token_data.get("username")
        user_role = token_data.get("role")

        allowed_roles = RBAC_PERMISSIONS["api_endpoints"].get(
            "POST /api/update_user_verification", [])
        if user_role not in allowed_roles:
            raise HTTPException(
                status_code=403, detail="Access denied. Contact administration.")

        try:
            data = await request.json()
        except Exception:
            raise HTTPException(status_code=400, detail="Invalid JSON payload")

        user_to_verify = data.get("user_to_verify")
        verification_status = data.get("verified")

        if user_to_verify is None or verification_status is None:
            raise HTTPException(
                status_code=400, detail="Missing required fields: 'user_to_verify' and 'verified'")

        response = await update_user_verification(db, username=user_to_verify, verified=verification_status, verified_by=username)

        if "error" in response:
            raise HTTPException(status_code=400, detail=response["error"])

        return response

    except HTTPException:
        raise
    except Exception as e:
        logger.exception("Unexpected error in update_user_verification")
        raise HTTPException(status_code=500, detail="Unexpected server error")


@app.post("/api/change_password")
async def change_user_password(
    request: Request,
    authorization: str = Header(None),
    db: Session = Depends(get_db)
):
    try:
        token_data, _ = await validate_bearer_token(authorization, db)
        username = token_data.get("username")

        try:
            data = await request.json()
        except Exception:
            raise HTTPException(status_code=400, detail="Invalid JSON payload")

        current_password = data.get("current_password")
        new_password = data.get("new_password")

        if not current_password or not new_password:
            raise HTTPException(
                status_code=400, detail="Both 'current_password' and 'new_password' are required.")

        response = await change_password(db, username, current_password, new_password)
        if "error" in response:
            raise HTTPException(status_code=400, detail=response["error"])

        return response

    except HTTPException:
        raise
    except Exception as e:
        logger.exception("Unexpected error in change_password")
        raise HTTPException(status_code=500, detail="Unexpected server error")


@app.delete("/api/remove_user")
async def remove_existing_user(
    request: Request,
    authorization: str = Header(None),
    db: Session = Depends(get_db)
):
    try:
        token_data, _ = await validate_bearer_token(authorization, db)
        requester = token_data.get("username")
        requester_role = token_data.get("role")

        allowed_roles = RBAC_PERMISSIONS["api_endpoints"].get(
            "DELETE /api/remove_user", [])
        if requester_role not in allowed_roles:
            raise HTTPException(
                status_code=403, detail="Access denied. Contact administration.")

        try:
            data = await request.json()
        except Exception:
            raise HTTPException(status_code=400, detail="Invalid JSON payload")

        user_to_remove = data.get("username_or_email")
        if not user_to_remove:
            raise HTTPException(
                status_code=400, detail="Missing required field: 'username_or_email'")

        response = await remove_user(db, requester, requester_role, user_to_remove)
        if "error" in response:
            raise HTTPException(status_code=400, detail=response["error"])

        return {
            "message": f"User '{user_to_remove}' removed successfully by '{requester}'."
        }

    except HTTPException:
        raise
    except Exception as e:
        logger.exception("Unexpected error in remove_user")
        raise HTTPException(status_code=500, detail="Unexpected server error")


@app.post("/api/forgot_password")
async def forgot_password(request: Request, db: Session = Depends(get_db)):
    try:
        try:
            data = await request.json()
        except Exception:
            raise HTTPException(status_code=400, detail="Invalid JSON payload")

        username_or_email = data.get("username_or_email")
        if not username_or_email:
            raise HTTPException(
                status_code=400, detail="Missing username/email")

        response = await forgot_password_request(db=db, username_or_email=username_or_email)

        if "error" in response:
            raise HTTPException(status_code=400, detail=response["error"])

        return {"message": "OTP sent successfully", **response}

    except HTTPException:
        raise
    except Exception as e:
        logger.exception("Unexpected error during forgot_password")
        raise HTTPException(status_code=500, detail="Unexpected server error")


@app.post("/api/verify_otp")
async def verify_user_otp(request: Request, db: Session = Depends(get_db)):
    try:
        try:
            data = await request.json()
        except Exception:
            raise HTTPException(status_code=400, detail="Invalid JSON payload")

        username_or_email = data.get("username_or_email")
        otp = data.get("otp")

        if not username_or_email or not otp:
            raise HTTPException(
                status_code=400, detail="Missing username/email or otp")

        response = await verify_otp(db=db, username_or_email=username_or_email, otp=otp)

        if "error" in response:
            raise HTTPException(status_code=400, detail=response["error"])

        return {"message": "OTP verified successfully", **response}

    except HTTPException:
        raise
    except Exception as e:
        logger.exception("Unexpected error during verify_otp")
        raise HTTPException(status_code=500, detail="Unexpected server error")


async def health_event_stream(request: Request):
    try:
        while True:
            if await request.is_disconnected():
                logger.info("Client disconnected from /api/health/stream")
                break

            try:
                health_data = {
                    "status": "healthy",
                    "timestamp": datetime.now().isoformat(),
                    "active_connections": len(manager.active_connections),
                    "version": "1.0.0",
                    "performance": []
                }

                yield f"data: {json.dumps(health_data)}\n\n"

            except Exception as e:
                error_msg = {"error": str(e), "timestamp": datetime.now().isoformat()}
                logger.error(f"SSE stream error: {e}")
                yield f"event: error\ndata: {json.dumps(error_msg)}\n\n"

            await asyncio.sleep(5) 

    except asyncio.CancelledError:
        logger.warning("SSE stream cancelled")
        raise
    except Exception as e:
        logger.exception(f"Unexpected error in SSE stream: {e}")
        raise

@app.get("/api/health/stream")
async def health_stream(request: Request):
    return StreamingResponse(
        health_event_stream(request),
        media_type="text/event-stream"
    )



@app.post("/api/register_agent_voice")
async def register_agent_voice(
    agent: UserVoiceRegistration,
    authorization: str = Header(None),
    db: Session = Depends(get_db)
):
    try:
        if not authorization or not authorization.startswith("Bearer "):
            raise HTTPException(status_code=401, detail="Missing or invalid Authorization header")

        token_data, _ = await validate_bearer_token(authorization, db)
        username = token_data.get("username")
        user_role = token_data.get("role")

        user = db.query(User).filter(User.username == username).first()
        if not user:
            raise HTTPException(status_code=404, detail="User not found")

        allowed_roles = RBAC_PERMISSIONS["api_endpoints"].get("POST /api/register_agent_voice", [])
        if user_role not in allowed_roles:
            raise HTTPException(status_code=403, detail="Not allowed to register voice")

        voice_processor = UserVoiceProcessing(username=username, request_data=agent.model_dump())
        file_path = voice_processor.save_audio(target_sr=24000, denoise=True)

        db_response = await add_voice_sample(db, username, file_path)

        logger.info(f"User {username} registered. Audio saved at {file_path}")
        return {
            "status": "success",
            "message": db_response["message"],
            "file_path": db_response["voice_path"],
        }

    except HTTPException:
        raise
    except Exception as e:
        logger.exception("Unexpected error in /api/register_agent_voice")
        raise HTTPException(status_code=500, detail="Unexpected server error")



@app.get("/api/get_all_users")
async def get_all_users(db: Session = Depends(get_db), authorization: str = Header(None)):
    """
    Get the list of all agents (pending/approved).
    """
    try:
        token_data, _ = await validate_bearer_token(authorization, db)
        user_role = token_data.get("role")

        allowed_roles = RBAC_PERMISSIONS["api_endpoints"].get(
            "GET /api/get_all_users", [])
        if user_role not in allowed_roles:
            raise HTTPException(
                status_code=403, detail="Access denied. Contact administration.")
        
        response = await get_verified_users(db, requester_role=user_role)

        if "error" in response:
            raise HTTPException(status_code=400, detail=response["error"])

        return response

    except HTTPException:
        raise
    except Exception as e:
        logger.exception("Unexpected error in update_user_verification")
        raise HTTPException(status_code=500, detail="Unexpected server error")


@app.post("/api/call_analyzer")
async def call_analyzer(
    request: Request,
    db: Session = Depends(get_db),
    authorization: str = Header(None)
):
    """
    Analyze the call and save the detailed output.
    """
    if not authorization or not authorization.startswith("Bearer "):
        raise HTTPException(status_code=401, detail="Missing or invalid Authorization header")

    try:
        token_data, _ = await validate_bearer_token(authorization, db)
        username = token_data.get("username")
        user_role = token_data.get("role")
    except Exception as e:
        raise HTTPException(status_code=401, detail=f"Token validation failed: {str(e)}")

    allowed_roles = RBAC_PERMISSIONS["api_endpoints"].get("POST /api/call_analyzer", [])
    if user_role not in allowed_roles:
        raise HTTPException(status_code=403, detail="Access denied. Contact administration.")

    user = db.query(User).filter(User.username == username).first()
    if not user:
        raise HTTPException(status_code=404, detail="User not found")

    if not user.voice_sample_path:
        raise HTTPException(
            status_code=400,
            detail="No voice sample found. Please upload a voice sample of yours before analyzing calls."
        )

    try:
        request_data = await request.json()
        call_id = request_data.get("call_id")
        call_recording_b64 = request_data.get("call_recording_b64")
        if not call_id or not call_recording_b64:
            raise HTTPException(status_code=422, detail="call_id and call_recording_b64 are required")
    except Exception as e:
        raise HTTPException(status_code=400, detail=f"Invalid request body: {str(e)}")

    try:
        sentiment_anlayzer = SentimentAnalyzer(
            agent_id=username,
            call_id=call_id,
            call_recording_b64=call_recording_b64,
        )
        analyzed_result = await sentiment_anlayzer.analyze()
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Call analysis failed: {str(e)}")
    
    with open("test.json", "w") as file:
        json.dump(analyzed_result, file, indent=4)

    try:
        saved_analysis = await save_call_analysis(db, user.id, call_id, analyzed_result)
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Failed to persist analysis result: {str(e)}")

    return {
        "status": "success",
        "response": saved_analysis,
        "saved_id": saved_analysis.id
    }


@app.websocket("/ws/client")
async def websocket_customer_endpoint(websocket: WebSocket, db: Session = Depends(get_db)):

    await websocket.accept()  
    
    token = websocket.query_params.get('token', None)

    try:
        token_data, _ = await validate_bearer_token(f"Bearer {token}", db)
        user_id = token_data.get("user_id")
        username = token_data.get("username")
        user_role = token_data.get("role")
    except Exception as e:
        await manager.send_personal_message(
            json.dumps({
                "type": "error",
                "message": "Token validation failed",
                "error_details": str(e)
            }),
            websocket,
        )
        await websocket.close()  
        raise HTTPException(status_code=401, detail=f"Token validation failed: {str(e)}")

    allowed_roles = RBAC_PERMISSIONS["sockets"].get("WS /ws/client", [])
 
    if user_role not in allowed_roles:
        await manager.send_personal_message(
            json.dumps({
                "type": "error",
                "message": "Access denied. Contact administration.",
                "error_details": "Role not allowed for this WebSocket endpoint"
            }),
            websocket,
        )
        await websocket.close()  
        raise HTTPException(status_code=403, detail="Access denied. Contact administration.")

    user = db.query(User).filter(User.id == user_id).first()
    if not user:
        await manager.send_personal_message(
            json.dumps({
                "type": "error",
                "message": "User not found",
                "error_details": "No user found with the provided username"
            }),
            websocket,
        )
        await websocket.close() 
        raise HTTPException(status_code=404, detail="User not found")
    
    session_id = str(uuid.uuid4())  
    await manager.connect(websocket, session_id)  

    try:
        while True:
            
            data = await websocket.receive_text()
            message = json.loads(data)

            if message.get("type") == "audio_chunk":
                try:
                    current_audio_chunk = message.get("data", {}).get("current_audio_chunk", "")
                    language_preference = message.get("data", {}).get("language", "auto")
                    sample_rate = message.get("data", {}).get("sample_rate", 16000)

                    args = {
                        "session_id": session_id,
                        "user_id": user_id,
                        "username": username,
                        "sample_rate": sample_rate,
                        "current_audio_chunk": current_audio_chunk,
                        "language_preference": language_preference,
                    }

                    processing_result = await voice_processor.processing(arguments=args)
                    print("Processing Result:", processing_result)

                except Exception as e:
                    logger.error(f"Customer audio processing error: {e}")
                    await manager.send_personal_message(
                        json.dumps({
                            "type": "error",
                            "message": "Audio processing failed.",
                            "error_details": str(e)
                        }),
                        websocket,
                    )

            else:
                await manager.send_personal_message(
                    json.dumps({
                        "type": "error",
                        "message": "Unsupported message type",
                        "error_details": "Only 'audio_chunk' type is currently supported."
                    }),
                    websocket,
                )

    except WebSocketDisconnect:
        logger.info("WebSocket disconnected.")
        manager.disconnect(websocket)

    except Exception as e:
        logger.error(f"Customer WebSocket error: {e}")
        await manager.send_personal_message(
            json.dumps({
                "type": "error",
                "message": "Unexpected error occurred.",
                "error_details": str(e)
            }),
            websocket,
        )
        manager.disconnect(websocket)



if __name__ == "__main__":
    import uvicorn

    uvicorn.run(app, host="0.0.0.0", port=8000, log_level="info")
