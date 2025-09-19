# Sound360 Complete Installation Guide - PostgreSQL Only

## 📋 System Requirements

### Hardware Requirements
- **CPU**: Intel i7 or AMD Ryzen 7 (8+ cores recommended)
- **RAM**: 16GB minimum (32GB recommended for large models)
- **Storage**: 50GB+ free SSD space
- **GPU**: NVIDIA RTX 3060+ (optional but recommended)
- **Network**: Stable internet for model downloads

### Software Requirements
- **Python 3.8+** (Recommended: Python 3.10)
- **Node.js 16+** and npm
- **PostgreSQL 13+**
- **Git**

## 🚀 Complete Installation Steps

### Step 1: Clone and Setup Project

```bash
# Clone the repository
git clone <your-sound360-repo>
cd Sound360

# Create required directories
mkdir -p backend-api/uploads/audio
mkdir -p backend-api/logs
mkdir -p backend-api/models
mkdir -p backend-api/uploads/photos
mkdir -p backend-api/uploads/debug
mkdir -p assets
```

### Step 2: PostgreSQL Installation

#### Option A: Using Docker (Recommended)
```bash
cd backend-api

# Start PostgreSQL with Docker
docker-compose up -d postgres

# Verify PostgreSQL is running
docker-compose ps
docker-compose logs postgres
```

#### Option B: Manual PostgreSQL Installation

**Ubuntu/Debian:**
```bash
sudo apt update
sudo apt install postgresql postgresql-contrib
sudo systemctl start postgresql
sudo systemctl enable postgresql

# Create user and database
sudo -u postgres psql
CREATE ROLE sound360 WITH LOGIN PASSWORD 'sound360';
ALTER ROLE sound360 CREATEDB;
CREATE DATABASE sound360_db OWNER sound360;
GRANT ALL PRIVILEGES ON DATABASE sound360_db TO sound360;
\q
```

**macOS:**
```bash
brew install postgresql
brew services start postgresql

# Create user and database
psql postgres
CREATE ROLE sound360 WITH LOGIN PASSWORD 'sound360';
ALTER ROLE sound360 CREATEDB;
CREATE DATABASE sound360_db OWNER sound360;
GRANT ALL PRIVILEGES ON DATABASE sound360_db TO sound360;
\q
```

**Windows:**
1. Download PostgreSQL from https://www.postgresql.org/download/windows/
2. Install with default settings
3. Open pgAdmin or psql and run:
```sql
CREATE ROLE sound360 WITH LOGIN PASSWORD 'sound360';
ALTER ROLE sound360 CREATEDB;
CREATE DATABASE sound360_db OWNER sound360;
GRANT ALL PRIVILEGES ON DATABASE sound360_db TO sound360;
```

### Step 3: Backend Setup

```bash
cd backend-api

# Create Python virtual environment
python3 -m venv venv
source venv/bin/activate  # Windows: venv\Scripts\activate

# Install Python dependencies
pip install -r requirements.txt

# Install system audio dependencies (Ubuntu/Debian)
sudo apt-get install -y portaudio19-dev python3-pyaudio ffmpeg

# macOS
# brew install portaudio ffmpeg

# Setup database tables
python database_setup.py
```

### Step 4: Download AI Models

```bash
# Download Qwen2.5-32B-AGI model
python -c "
from huggingface_hub import hf_hub_download
print('Downloading Qwen2.5-32B-AGI model...')
model_path = hf_hub_download(
    repo_id='bartowski/Qwen2.5-32B-AGI-GGUF',
    filename='Qwen2.5-32B-AGI-Q5_K_M.gguf',
    local_dir='./models'
)
print(f'Model downloaded to: {model_path}')
"

# Verify model download
ls -la models/
```

### Step 5: Setup Audio Assets

```bash
# Create assets directory
mkdir -p ../assets

# You need to provide these audio files:
# - Speaker1.wav (voice sample for TTS cloning)
# - listening.wav (listening sound effect)
# - transition.wav (transition sound effect)
# - aria_icon.png (application icon)
# - loading.gif (loading animation)
# - transition.gif (transition animation)
# - muted_mic.gif (muted microphone animation)

# Copy your existing assets
cp /path/to/your/assets/* ../assets/
```

### Step 6: Configuration

#### Update Model Paths
```bash
# Edit the configuration file
nano ../configs/default.json

# Update the LLM custom_path to your downloaded model:
# "custom_path": "/full/path/to/Sound360/backend-api/models/Qwen2.5-32B-AGI-Q5_K_M.gguf"
```

#### Example Configuration Update
```json
{
  "Llm": {
    "params": {
      "custom_path": "/home/username/Sound360/backend-api/models/Qwen2.5-32B-AGI-Q5_K_M.gguf",
      "model_name": "bartowski/Qwen2.5-32B-AGI-GGUF",
      "model_file": "Qwen2.5-32B-AGI-Q5_K_M.gguf",
      "num_gpu_layers": -1,
      "context_length": 8000,
      "streaming_output": true,
      "chat_format": "qwen",
      "system_message": "You are a helpful multilingual customer service assistant.",
      "verbose": false
    }
  }
}
```

### Step 7: Frontend Setup

```bash
# Navigate to project root
cd ..

# Install Node.js dependencies
npm install

# Build frontend (optional)
npm run build
```

### Step 8: Genesys Cloud Integration (Optional)

If you want to connect with Genesys Cloud:

```bash
cd backend-api

# Create Genesys configuration
cat > genesys_config.json << EOF
{
  "client_id": "your-genesys-oauth-client-id",
  "client_secret": "your-genesys-oauth-client-secret",
  "environment": "mypurecloud.com",
  "organization_id": "your-organization-id",
  "queue_ids": ["your-queue-id-1", "your-queue-id-2"],
  "webhook_url": "https://your-sound360-server.com/api/genesys/webhook"
}
EOF
```

## 🏃‍♂️ Running the Application

### Start Backend
```bash
cd backend-api
source venv/bin/activate  # Windows: venv\Scripts\activate
python local_start.py
```

### Start Frontend (New Terminal)
```bash
cd Sound360
npm run dev
```

### Access Application
- **Frontend Dashboard**: http://localhost:5173
- **Backend API**: http://localhost:8000
- **Swagger Documentation**: http://localhost:8000/api/docs
- **ReDoc Documentation**: http://localhost:8000/api/redoc
- **pgAdmin**: http://localhost:8080 (if using Docker)

## 🔧 API Endpoints Available

### Voice Processing
- `POST /api/voice/transcribe` - Audio transcription with sentiment
- `POST /api/voice/sentiment` - Sentiment analysis
- `POST /api/voice/generate` - AI response generation
- `POST /api/voice/tts` - Text-to-speech synthesis
- `GET /api/voice/status` - Component status

### Analytics & Reporting
- `GET /api/analytics/dashboard` - Dashboard data
- `GET /api/analytics/kpis` - Key performance indicators
- `GET /api/analytics/sentiment-trends` - Sentiment over time
- `GET /api/analytics/export` - Data export

### User Management
- `GET /api/users/` - Get all users (with pagination)
- `POST /api/users/` - Create new user
- `GET /api/users/{user_id}` - Get specific user
- `PUT /api/users/{user_id}` - Update user
- `DELETE /api/users/{user_id}` - Delete user

### System Administration
- `GET /api/admin/health` - System health check
- `GET /api/admin/config` - Get system configuration
- `POST /api/admin/config` - Update configuration
- `GET /api/admin/logs` - Get system logs

### Genesys Integration
- `POST /api/genesys/webhook` - Webhook for call events
- `GET /api/genesys/status` - Integration status
- `GET /api/genesys/calls` - Active calls
- `POST /api/genesys/configure` - Configure integration

### WebSocket Endpoints
- `ws://localhost:8000/ws/client/{session_id}` - Voice chat
- `ws://localhost:8000/ws/admin` - Admin monitoring

## 🧪 Testing the System

### Test Database Connection
```bash
cd backend-api
python -c "
from database_setup import test_database_connection
test_database_connection()
"
```

### Test Voice Processing
```bash
# Test transcription API
curl -X POST "http://localhost:8000/api/voice/transcribe" \
  -H "Content-Type: application/json" \
  -d '{
    "audio_data": "base64-encoded-audio",
    "session_id": "test-session",
    "language": "auto"
  }'
```

### Test User Management
```bash
# Get all users
curl -X GET "http://localhost:8000/api/users/"

# Create new user
curl -X POST "http://localhost:8000/api/users/" \
  -H "Content-Type: application/json" \
  -d '{
    "name": "Test User",
    "email": "test@example.com",
    "role": "User"
  }'
```

## 🔍 Troubleshooting

### PostgreSQL Connection Issues
```bash
# Check if PostgreSQL is running
sudo systemctl status postgresql  # Linux
brew services list | grep postgresql  # macOS

# Test connection
psql postgresql://sound360:sound360@localhost:5432/sound360_db

# Check logs
docker-compose logs postgres  # If using Docker
```

### Model Loading Issues
```bash
# Check if model exists
ls -la backend-api/models/

# Check model path in config
grep -r "custom_path" configs/

# Test model loading
python -c "
import os
model_path = 'backend-api/models/Qwen2.5-32B-AGI-Q5_K_M.gguf'
print(f'Model exists: {os.path.exists(model_path)}')
print(f'Model size: {os.path.getsize(model_path) / (1024**3):.2f} GB' if os.path.exists(model_path) else 'Model not found')
"
```

### Audio Issues
```bash
# Test audio dependencies
python -c "
try:
    import pyaudio
    print('✅ PyAudio OK')
except ImportError as e:
    print(f'❌ PyAudio error: {e}')

try:
    import soundfile
    print('✅ SoundFile OK')
except ImportError as e:
    print(f'❌ SoundFile error: {e}')
"
```

### Memory Issues
```bash
# Monitor memory usage
htop

# Use smaller model if needed (Q4_K_M instead of Q5_K_M)
# Download smaller model:
python -c "
from huggingface_hub import hf_hub_download
hf_hub_download('bartowski/Qwen2.5-32B-AGI-GGUF', 'Qwen2.5-32B-AGI-Q4_K_M.gguf', local_dir='./models')
"
```

## 🎯 Features Available

### ✅ Core Features
- **Real-time Speech Recognition** (30+ languages)
- **Sentiment Analysis** (English + Arabic)
- **Local LLM Integration** (Qwen2.5-32B-AGI)
- **PostgreSQL Database** with full user management
- **Complete API Documentation** with Swagger
- **WebSocket Support** for real-time communication

### ✅ Call Center Features
- **Genesys Cloud Integration** for real call processing
- **Live Call Monitoring** with sentiment analysis
- **Customer Tier Management** (Standard/Premium/VIP)
- **Escalation Workflows** to human agents
- **Performance Analytics** with KPIs
- **Business Intelligence** reporting

### ✅ Enterprise Features
- **User Management** with role-based access
- **System Configuration** management
- **Performance Monitoring** with metrics
- **Audit Logging** for compliance
- **Data Export** capabilities

The system is now ready for enterprise deployment with complete PostgreSQL integration, full API coverage, and Genesys Cloud connectivity for real call center operations!