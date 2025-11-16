# Libra - AI Debate Training Copilot

## Elevator Pitch

**Libra** is a mobile AI debate coach that turns any smartphone into an intelligent training partner. Designed for high school debaters, Model UN students, and anyone looking to sharpen their argumentation skills, Libra provides real-time analysis of logical fallacies and factual accuracy during live debates. Simply pass the phone between speakers, argue your points, and receive instant AI-powered feedback with sourced corrections and educational insights—transforming debate practice from guesswork into data-driven skill development.

---

## About

### Overview

Libra is an end-to-end debate analysis system that combines speech recognition, natural language processing, and AI-powered reasoning to provide comprehensive debate coaching. The application enables two speakers to conduct turn-based debates while receiving immediate feedback on:

- **Logical Fallacies**: Detection and explanation of common argumentation errors (ad hominem, straw man, false dichotomy, etc.)
- **Fact-Checking**: Real-time verification of factual claims with authoritative sources
- **Argument Summarization**: AI-generated summaries of key points and thesis statements
- **Performance Analytics**: Post-debate visualizations and comparative analysis

### System Architecture

Libra follows a client-server architecture with clear separation of concerns:

#### **Frontend Layer** (React Native + Expo)
The mobile application handles user interaction, audio capture, and real-time state management through a turn-based interface:
- **Audio Recording Pipeline**: Uses `expo-av` to capture speaker arguments in configurable time chunks (default 60 seconds)
- **State Management**: Zustand store manages debate sessions, turn data, analysis results, and UI states
- **Component Architecture**: Modular design with dedicated screens for debate flow (home, active debate, post-debate analysis)
- **Visualization Engine**: Charts and analytics powered by React Native chart libraries

#### **Backend Layer** (Flask + Python)
The REST API server orchestrates AI analysis through multiple specialized services:
- **Transcription Service**: Converts audio to text using ElevenLabs Speech-to-Text API
- **Fallacy Detection Service**: Analyzes transcripts using OpenAI GPT-4 to identify logical fallacies with confidence scoring
- **Fact-Checking Agent**: Multi-step pipeline that extracts verifiable claims, searches for evidence, and synthesizes verdicts with source attribution
- **Summary Generation**: Produces structured argument summaries using GPT-4 with specialized prompting

#### **Data Flow Architecture**
```
Mobile App → Audio Capture → Backend API
              ↓
         Transcription (ElevenLabs)
              ↓
    ┌────────┴────────┐
    ↓                 ↓
Fallacy Analysis   Fact Checking
(OpenAI GPT-4)    (OpenAI GPT-4)
    ↓                 ↓
    └────────┬────────┘
              ↓
       JSON Response
              ↓
      Mobile UI Update
```

#### **Processing Pipeline**
1. **Audio Ingestion**: Speaker records turn, audio sent as multipart form-data
2. **Parallel Processing**: Fallacy detection and fact-checking run concurrently
3. **Results Aggregation**: Structured JSON responses with unique IDs, confidence scores, and metadata
4. **Client Polling/Updates**: Frontend receives analysis and updates UI with cards, sources, and explanations

### Key Design Decisions

- **Turn-Based Interaction**: Physical phone-passing creates natural debate rhythm and prevents audio overlap
- **Progressive Disclosure**: Results appear incrementally (transcript → fallacies → facts) to maintain engagement during analysis
- **Educational Framing**: System presents findings as learning opportunities, not absolute judgments
- **Source Attribution**: All fact-checks include clickable sources to encourage verification and critical thinking
- **Confidence Transparency**: Analysis results display certainty levels to teach nuanced reasoning

---

## Frameworks and Technologies

### **Frontend Stack**

| Technology | Version | Purpose |
|------------|---------|---------|
| **React Native** | 0.81.5 | Cross-platform mobile framework for iOS/Android |
| **Expo** | ~54.0.23 | Development platform for rapid iteration and deployment |
| **Expo Router** | ~6.0.14 | File-based navigation system |
| **TypeScript** | ~5.9.2 | Type-safe development with enhanced IDE support |
| **Zustand** | ^5.0.8 | Lightweight state management for debate sessions and analysis |
| **expo-av** | ~16.0.7 | Audio recording and playback capabilities |
| **Axios** | ^1.13.2 | HTTP client for backend API communication |
| **React Native Markdown Display** | ^7.0.2 | Rendering formatted text in summaries and explanations |
| **Expo Haptics** | ~15.0.7 | Tactile feedback for user interactions |

### **Backend Stack**

| Technology | Version | Purpose |
|------------|---------|---------|
| **Flask** | 3.1.2 | Lightweight Python web framework for REST API |
| **Flask-CORS** | 6.0.1 | Cross-origin resource sharing for mobile client |
| **OpenAI API** | 2.8.0 | GPT-4 for fallacy detection, fact-checking, and summarization |
| **ElevenLabs API** | ≥1.1.0 | High-accuracy speech-to-text transcription |
| **python-dotenv** | 1.2.1 | Environment variable management for API keys |
| **Requests** | 2.32.5 | HTTP library for external API calls |
| **Werkzeug** | 3.1.3 | WSGI utility library for Flask |

### **AI/ML Services**

- **OpenAI GPT-4-mini**: Primary LLM for natural language understanding, fallacy classification, claim extraction, and summary generation
- **ElevenLabs Turbo v2**: Real-time speech-to-text with support for multiple audio formats (M4A, WAV, MP3)

### **Development Tools**

- **ESLint** | ^9.25.0 | Code quality and consistency enforcement
- **TypeScript Compiler** | Type checking and compilation for frontend
- **Node.js Package Manager (npm)** | Dependency management for frontend
- **Python venv** | Isolated Python environment for backend dependencies
- **Git** | Version control with feature branch workflow

### **API Endpoints Architecture**

| Endpoint | Method | Function |
|----------|--------|----------|
| `/api/test` | GET | Health check endpoint |
| `/api/transcribe` | POST | Audio-to-text transcription |
| `/api/analyze_text` | POST | Text fallacy analysis |
| `/api/fallacies` | POST | Fallacy detection with structured output |
| `/api/factcheck` | POST | Claim verification with source attribution |
| `/api/generate-summary` | POST | Argument summarization |

### **Security & Configuration**

- **Environment Variables**: All API keys stored in `.env` files (never committed)
- **CORS Configuration**: Restricted to mobile client origins
- **Error Handling**: Graceful degradation with user-friendly error messages
- **Data Privacy**: Audio files not permanently stored, processed in-memory only

---

## Quick Start

Simple, step-by-step setup for macOS and Windows.

## Backend setup (Flask)
- macOS:
```bash
cd backend
python3 -m venv venv
source venv/bin/activate
pip install -r requirements.txt
```
- Windows (PowerShell or CMD):
```bash
cd backend
python -m venv venv
venv\Scripts\activate
pip install -r requirements.txt
```

## Environment
Create backend/.env with your ElevenLabs key:
```bash
echo ELEVENLABS_API_KEY=YOUR_KEY_HERE > backend/.env   # macOS
```
On Windows, create backend\.env and add:
```
ELEVENLABS_API_KEY=YOUR_KEY_HERE
```

## Run backend
```bash
cd backend
source venv/bin/activate            # macOS
# venv\Scripts\activate             # Windows
python app.py
```

## Frontend setup (Expo)
```bash
cd frontend
npm install
npm start
```
