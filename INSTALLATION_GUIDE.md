# Sound360 Local Call Center Installation Guide

## 📋 Prerequisites

### System Requirements
- **Python 3.8+** (Recommended: Python 3.10)
- **Node.js 16+** and npm
- **8GB+ RAM** (16GB recommended for LLM models)
- **GPU** (Optional but recommended for better performance)
- **10GB+ free disk space** for models

### Hardware Recommendations
- **CPU**: Intel i7 or AMD Ryzen 7 (8+ cores)
- **RAM**: 16GB+ (32GB for large models)
- **GPU**: NVIDIA RTX 3060+ (Optional but improves performance)
- **Storage**: SSD with 50GB+ free space

## 🚀 Installation Steps

### Step 1: Clone and Setup Project Structure

```bash
# Clone your project
git clone <your-sound360-repo>
cd Sound360

# Create the required directory structure
mkdir -p backend-api/uploads/audio
mkdir -p backend-api/logs
mkdir -p backend-api/models
mkdir -p assets
```

### Step 2: Backend Setup

```bash
# Navigate to backend-api directory
cd backend-api

# Create Python virtual environment
python3 -m venv venv
source venv/bin/activate  # On Windows: venv\Scripts\activate

# Install Python dependencies
pip install -r requirements.txt

# Install additional audio dependencies (Ubuntu/Debian)
sudo apt-get update
sudo apt-get install -y portaudio19-dev python3-pyaudio
sudo apt-get install -y ffmpeg  # For audio processing

# For macOS
# brew install portaudio
# brew install ffmpeg

# For Windows
# Download and install ffmpeg from https://ffmpeg.org/download.html
```

### Step 3: Model Setup

#### 3.1 Download LLM Model (Qwen2.5-32B-AGI)
```bash
# Create models directory
mkdir -p models

# Option 1: Download using huggingface-hub
python -c "
from huggingface_hub import hf_hub_download
model_path = hf_hub_download(
    repo_id='bartowski/Qwen2.5-32B-AGI-GGUF',
    filename='Qwen2.5-32B-AGI-Q5_K_M.gguf',
    local_dir='./models'
)
print(f'Model downloaded to: {model_path}')
"

# Option 2: Manual download
# Visit: https://huggingface.co/bartowski/Qwen2.5-32B-AGI-GGUF
# Download: Qwen2.5-32B-AGI-Q5_K_M.gguf
# Place in: backend-api/models/
```

#### 3.2 Setup Audio Assets
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

# Example: Copy your existing assets
cp /path/to/your/assets/* ../assets/
```

### Step 4: Configuration

#### 4.1 Update Model Paths in Config
```bash
# Edit configs/default.json
nano ../configs/default.json

# Update the LLM custom_path to point to your downloaded model:
# "custom_path": "/full/path/to/Sound360/backend-api/models/Qwen2.5-32B-AGI-Q5_K_M.gguf"
```

#### 4.2 Example Configuration Update
```json
{
  "Llm": {
    "params": {
      "custom_path": "/home/your-username/Sound360/backend-api/models/Qwen2.5-32B-AGI-Q5_K_M.gguf",
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

### Step 5: Frontend Setup

```bash
# Navigate to project root
cd ..

# Install Node.js dependencies
npm install

# Build frontend for production (optional)
npm run build
```

### Step 6: Database Initialization

```bash
# Navigate back to backend-api
cd backend-api

# Initialize the local database
python -c "
from local_main import init_local_db
init_local_db()
print('Database initialized successfully')
"
```

## 🏃‍♂️ Running the Application

### Step 1: Start Backend Server
```bash
# Navigate to backend-api directory
cd backend-api

# Activate virtual environment
source venv/bin/activate  # On Windows: venv\Scripts\activate

# Start the FastAPI server
python local_main.py

# Or use uvicorn directly
uvicorn local_main:app --host 0.0.0.0 --port 8000 --reload
```

### Step 2: Start Frontend (in a new terminal)
```bash
# Navigate to project root
cd Sound360

# Start development server
npm run dev

# Or for production
npm run build
npm run preview
```

### Step 3: Access the Application
- **Frontend Dashboard**: http://localhost:5173
- **Backend API**: http://localhost:8000
- **API Documentation**: http://localhost:8000/api/docs

## 🔧 Configuration Options

### GPU Configuration
If you have a GPU, update the config:
```json
{
  "Stt": {
    "params": {
      "device": "cuda:0"
    }
  },
  "Llm": {
    "params": {
      "num_gpu_layers": -1
    }
  },
  "Tts": {
    "params": {
      "device": "gpu"
    }
  }
}
```

### CPU-Only Configuration
For CPU-only deployment:
```json
{
  "Stt": {
    "params": {
      "device": "cpu"
    }
  },
  "Llm": {
    "params": {
      "num_gpu_layers": 0
    }
  },
  "Tts": {
    "params": {
      "device": "cpu"
    }
  }
}
```

## 🧪 Testing the System

### Test Voice Chat
1. Open http://localhost:5173/voice-chat
2. Click the microphone button
3. Speak clearly in English or Arabic
4. Check that transcription appears
5. Verify AI response is generated
6. Check sentiment analysis in the response

### Test Call Center Features
1. Open http://localhost:5173/call-center
2. View analytics dashboard
3. Check real-time monitoring at http://localhost:5173/real-time
4. Test conversation history at http://localhost:5173/conversations

## 🐛 Troubleshooting

### Common Issues

#### 1. Model Not Found
```bash
# Check if model file exists
ls -la backend-api/models/

# Re-download if missing
cd backend-api
python -c "
from huggingface_hub import hf_hub_download
hf_hub_download('bartowski/Qwen2.5-32B-AGI-GGUF', 'Qwen2.5-32B-AGI-Q5_K_M.gguf', local_dir='./models')
"
```

#### 2. Audio Issues
```bash
# Check audio dependencies
python -c "import pyaudio; print('PyAudio OK')"
python -c "import soundfile; print('SoundFile OK')"

# Test microphone access
python -c "
import pyaudio
p = pyaudio.PyAudio()
print(f'Audio devices: {p.get_device_count()}')
p.terminate()
"
```

#### 3. Memory Issues
```bash
# Monitor memory usage
htop

# Use smaller model if needed
# Download Q4_K_M instead of Q5_K_M for lower memory usage
```

#### 4. Port Conflicts
```bash
# Check if ports are in use
netstat -tulpn | grep :8000
netstat -tulpn | grep :5173

# Kill processes if needed
sudo kill -9 $(lsof -t -i:8000)
```

## 📊 Features Available

### ✅ Implemented Features
- **Real-time Speech Recognition** (30+ languages)
- **Sentiment Analysis** (English + Arabic)
- **Speaker Diarization** (identifies multiple speakers)
- **Local LLM Integration** (Qwen2.5-32B-AGI)
- **Call Center Analytics** with KPIs
- **Live Monitoring** of conversations
- **Custom Vocabulary** support
- **Multilingual Support** (English/Arabic focus)
- **Performance Metrics** and reporting

### 🎯 Call Center Specific
- **Customer Tier Management** (Standard, Premium, VIP)
- **Escalation Triggers** for supervisor intervention
- **Compliance Monitoring** for quality assurance
- **Real-time Alerts** for urgent situations
- **Business Intelligence** with upsell detection
- **ROI Tracking** and cost analysis

## 🔐 Security & Privacy

- **Local Processing**: All data stays on your servers
- **No Cloud Dependencies**: Complete offline operation
- **Encrypted Storage**: Conversation data protection
- **Access Control**: Role-based permissions
- **Audit Logging**: Complete activity tracking

## 📞 Support

If you encounter issues:
1. Check the logs in `backend-api/logs/`
2. Verify all dependencies are installed
3. Ensure model files are in the correct location
4. Check system resources (RAM, disk space)
5. Test individual components separately

The system is now ready for enterprise call center deployment with your existing VAD, STT, LLM, and TTS components integrated with advanced analytics!