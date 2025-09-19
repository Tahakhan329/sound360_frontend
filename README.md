# Sound360 - Advanced AI Voice Assistant

**Sound360** is a cutting-edge AI voice assistant platform developed by **Inseyab**, featuring real-time audio processing, intelligent conversation management, comprehensive call center analytics, and enterprise-grade monitoring capabilities.

## 🌟 Features

### 🎙️ Core AI Capabilities
- **Voice Activity Detection (VAD)** - Advanced speech detection using Silero VAD
- **Speech-to-Text (STT)** - High-accuracy transcription with Whisper Large-v2 (30+ languages)
- **Large Language Model (LLM)** - Local Qwen2.5-32B-AGI for intelligent responses
- **Text-to-Speech (TTS)** - Natural voice synthesis with Coqui TTS
- **Real-time Audio Processing** - Sub-2 second response times
- **Sentiment Analysis** - Real-time emotion detection using Hugging Face Transformers
- **Speaker Diarization** - Identify and separate multiple speakers in conversations

- **Real-time Call Monitoring** - Live conversation tracking with analytics
- **Customer Tier Management** - Handle Standard, Premium, and VIP customers
- **Escalation Management** - Automatic routing to human agents
- **Compliance Monitoring** - Quality assurance and regulatory compliance
- **Performance Analytics** - KPIs, NPS, resolution rates, and business intelligence
- **Multilingual Support** - 30+ languages with Arabic specialization using CAMeL Tools approach
- **Custom Vocabulary** - Domain-specific term recognition for better accuracy
- **Live Sentiment Tracking** - Real-time emotion analysis during conversations
### 🖥️ Admin Dashboard
- **Real-time Monitoring** - Live system metrics and performance analytics
- **Conversation Management** - Search, filter, and analyze user interactions
- **System Metrics** - CPU, Memory, GPU usage monitoring with beautiful charts
- **Audio Session Tracking** - Monitor and manage conversation sessions
- **Configuration Management** - Dynamic system configuration with JSON editor
- **Dark Theme UI** - Modern, responsive interface with smooth animations

### 🔧 Technical Architecture
- **Backend**: FastAPI with SQLAlchemy ORM and comprehensive API documentation
- **Frontend**: React with TypeScript, Tailwind CSS, and Framer Motion
- **Database**: SQLite/PostgreSQL with Alembic migrations
- **Real-time**: WebSocket connections for live updates
- **Charts**: Recharts for beautiful data visualization
- **State Management**: TanStack Query for efficient server state management

## 🚀 Quick Start

### Prerequisites
- Python 3.8+ (Recommended: 3.10)
- Node.js 16+
- 8GB+ RAM (16GB recommended)
- 10GB+ free disk space
- GPU (optional but recommended)
- Python 3.8+
- Node.js 16+
- npm or yarn

### Installation

1. **Clone the repository**
```bash
git clone <repository-url>
cd sound360
```

2. **Backend Setup**
```bash
cd backend-api
pip install -r requirements.txt
alembic upgrade head
python start.py
```

3. **Frontend Setup**
```bash
npm install
npm run dev
```

4. **Access the Application**
- Admin Dashboard: http://localhost:5173
- API Documentation: http://localhost:8000/api/docs
- ReDoc Documentation: http://localhost:8000/api/redoc

- **Call Center Dashboard**: http://localhost:5173
- **Voice Chat Interface**: http://localhost:5173/voice-chat
- **Real-time Monitoring**: http://localhost:5173/real-time
- **API Documentation**: http://localhost:8000/api/docs
## 📖 Documentation

### API Endpoints
- **Health**: `GET /api/health` - System health check
- **Conversations**: `GET/POST /api/conversations` - Manage conversations
- **Metrics**: `GET /api/metrics` - System performance metrics
- **Configuration**: `GET/POST /api/configurations` - System configuration
- **Audio**: `POST /api/audio/upload` - Audio file upload
- **Sessions**: `GET /api/sessions` - Audio session management

### WebSocket Endpoints
- **Client**: `ws://localhost:8000/ws/client/{session_id}` - Client connections
- **Admin**: `ws://localhost:8000/ws/admin` - Admin dashboard updates

## 🏗️ Architecture

### Backend Components
```
backend-api/
├── main.py              # FastAPI application
├── database.py          # SQLAlchemy models
├── schemas.py           # Pydantic schemas
├── alembic/             # Database migrations
└── components/          # AI processing components
```

### Frontend Components
```
src/
├── components/
│   ├── Dashboard.tsx    # Main dashboard
│   ├── Conversations.tsx
│   ├── SystemMetrics.tsx
│   ├── Configuration.tsx
│   ├── AudioSessions.tsx
│   ├── About.tsx        # Company information
│   └── Contact.tsx      # Contact details
└── App.tsx             # Main application
```

## 🔧 Configuration

The system supports dynamic configuration management for:
- **VAD Settings**: Threshold, speech detection parameters
- **STT Configuration**: Model selection, language settings
- **LLM Parameters**: Model path, context length, temperature
- **TTS Settings**: Voice selection, synthesis parameters

## 🌐 Deployment

### Development
```bash
# Backend
python start.py --reload

# Frontend
npm run dev
- **Live Sentiment Analysis** during conversations
- **Speaker Identification** in multi-party calls
- **Urgency Detection** for priority handling
- **Compliance Scoring** for quality assurance
- **Performance KPIs** (FCR, AHT, CSAT, NPS)
```
- **30+ Languages** with automatic detection
- **Arabic Specialization** using CAMeL Tools approach
- **Custom Vocabulary** for domain-specific terms
- **Real-time Translation** capabilities

- **Customer Tier Management** (Standard/Premium/VIP)
- **Escalation Workflows** to human agents
- **Business Intelligence** with upsell detection
- **ROI Tracking** and cost analysis
- **Audit Logging** for compliance
### Production
```bash
# Build frontend
npm run build

# Start backend
python start.py --host 0.0.0.0 --port 8000

# Or use Docker

## 📊 Monitoring

The platform includes comprehensive monitoring:

## 🔒 Security


## 🤝 Contributing

1. Fork the repository
2. Create a feature branch (`git checkout -b feature/amazing-feature`)
3. Commit your changes (`git commit -m 'Add amazing feature'`)
4. Push to the branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request

## 📄 License

This project is licensed under the GNU AGPLv3 License - see the [LICENSE](LICENSE) file for details.

## 🏢 About Inseyab

**Sound360** is proudly developed by **Inseyab**, a leading technology company specializing in AI-powered business intelligence and data analytics solutions.

### Our Mission
Inseyab was founded with a singular purpose: to break down the barriers between organizations and their data. We bridge the gap between complex data and actionable insights through cutting-edge no-code/low-code Business Intelligence solutions, infused with artificial intelligence.

### Global Presence
- **UAE**: Head Office in Abu Dhabi
- **Saudi Arabia**: Regional Office in Riyadh  
- **Pakistan**: Development Office in Karachi

For more information, visit [inseyab.com](https://inseyab.com/)

## 📞 Support

For technical support and inquiries:
- **Documentation**: Check `/api/docs` for comprehensive API documentation
- **Issues**: Open an issue on the repository
- **Contact**: Reach out through our [contact page](https://inseyab.com/contact)

---

**Developed with ❤️ by the Inseyab Team**"# sound360_frontend" 
