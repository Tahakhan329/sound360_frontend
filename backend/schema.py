from pydantic import BaseModel
from datetime import datetime
from typing import Optional

class ConversationSchema(BaseModel):
 id:str
 user_message: str
ai_response: str
timestamp:datetime
processing_time:float
audio_duration: float
session_id: str
language: str = "en"
confidenec_score: Optional[float] = None
customer_id: Optional[str]= None
customer_tier: str = "en"
issue_category: Optional[str]=None
resolution_status: str
satisfaction_rating: Optional[int]=None
audio_file_path: Optional[str] = None


class systemMetrics(BaseModel):
 id: int
cpu_usage:float
memory_usage:float
gpu_usage:float
active_connections: int
request_per_minute: int
response_time: float
error_rate: float
transcription_accuracy: float
customer_satisfaction: float


class Configration(BaseModel):
 id: str
config_data: str
created_at: datetime
is_active: bool
description: str
created_by: str





