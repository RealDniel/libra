# Libra - AI Debate Training Copilot
---
## About
### Overview

Libra is an end-to-end debate analysis system that combines speech recognition, natural language processing, and AI-powered reasoning to provide comprehensive debate coaching. The application enables two speakers to conduct turn-based debates while receiving immediate feedback on:

- **Logical Fallacies**: Detection and explanation of common argumentation errors (ad hominem, straw man, false dichotomy, etc.)
- **Fact-Checking**: Real-time verification of factual claims with authoritative sources
- **Argument Summarization**: AI-generated summaries of key points and thesis statements

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
- **Fallacy Detection Service**: Custom fine-tuned model analyzes transcripts to identify logical fallacies with confidence scoring
- **Fact-Checking Agent**: Agentic workflow using ReAct pattern (Reasoning + Acting) - iteratively searches, evaluates, and refines results until confident, then synthesizes verdicts with source attribution
- **Summary Generation**: Produces structured argument summaries using GPT-4 with specialized prompting

#### **Data Flow Architecture**
```
Mobile App → Audio Capture → Backend API
              ↓
         Transcription (ElevenLabs)
              ↓
    ┌────────┴────────┐
    ↓                 ↓
Fallacy Analysis   Fact-Checking Agent
(Fine-tuned model)  (ReAct Agentic Loop)
                    ┌─────────────────────┐
                    │ 1. Extract claims   │
                    │ 2. Search for info  │
                    │ 3. Evaluate results │
                    │ 4. Decide: more?    │
                    │    ↓ Yes → Loop 2-4 │
                    │    ↓ No  → Synthesize
                    └─────────────────────┘
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

## Features

### 🎤 **Real-Time Audio Capture & Transcription**
- Turn-based recording with configurable time limits (default 60 seconds)
- High-accuracy speech-to-text powered by ElevenLabs
- Support for multiple audio formats (M4A, WAV, MP3)
- Visual feedback with timer countdown and recording indicator

### 🧠 **AI-Powered Logical Fallacy Detection**
- Identifies 8+ common argumentation fallacies:
  - Ad Hominem, Straw Man, False Dichotomy
  - Slippery Slope, Appeal to Authority
  - Hasty Generalization, Red Herring, Circular Reasoning
- Provides educational explanations for each detected fallacy
- Confidence scoring to indicate certainty of detection

### ✅ **Intelligent Fact-Checking (Agentic ReAct)**
- **Autonomous Agent**: Uses ReAct pattern (Reasoning + Acting) to iteratively search and refine
- **Multi-hop Reasoning**: Agent decides what to search, evaluates results, and searches again if needed
- **Self-directed Loop**: Continues gathering information until confident in verdict
- Extracts verifiable factual claims from arguments
- Searches authoritative sources for verification
- Returns verdicts: **Verified**, **False**, **Misleading**, or **Unverifiable**
- Includes clickable source citations with snippets for transparency
- Only flags claims that are demonstrably false

### 📊 **Comprehensive Post-Debate Analysis**
- AI-generated summaries of each speaker's key arguments and thesis
- Side-by-side comparison of speakers
- Fallacy and false claim breakdowns per speaker
- Visual presentation with modern, animated UI
- Markdown-formatted summaries for readability

### 💾 **Debate History & Persistence**
- Automatic saving of completed debates to Snowflake database
- Retrieval of past debates for review
- Structured storage of transcripts, analysis, and metadata
- Searchable debate archive

### 📱 **Mobile-First Design**
- Native mobile experience with React Native
- Smooth animations and haptic feedback
- Responsive layouts for phones and tablets
- Offline-capable for reviewing past debates

---

## Data Models

### Debate Session
```typescript
{
  id: string                    // Unique session identifier
  topic?: string                // Optional debate topic
  speakerNames: {
    A: string                   // Speaker A name
    B: string                   // Speaker B name
  }
  turns: Turn[]                 // Array of debate turns
  status: 'active' | 'completed'
  createdAt: Date
  completedAt?: Date
}
```

### Turn
```typescript
{
  id: string                    // Unique turn identifier
  speaker: 'A' | 'B'            // Which speaker
  turnNumber: number            // Sequential turn count
  transcript: string            // Transcribed text
  duration: number              // Length in seconds
  fallacies: Fallacy[]          // Detected fallacies
  factChecks: FactCheck[]       // Fact-check results
}
```

### Fallacy
```typescript
{
  id: string
  type: string                  // e.g., "Ad Hominem", "Straw Man"
  explanation: string           // Educational description
  quote?: string                // Specific text that triggered detection
  confidence?: number           // 0-100 confidence score
}
```

### Fact Check
```typescript
{
  id: string
  claim: string                 // Extracted factual claim
  verdict: 'verified' | 'false' | 'misleading' | 'unverifiable'
  explanation: string           // Context and correction
  confidence: number            // 0-100 confidence score
  sources?: {                   // Supporting evidence
    title: string
    url: string
    snippet: string
  }[]
}
```

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

- **Custom Fine-tuned Model**: Specialized fallacy detection trained on debate datasets
- **OpenAI GPT-4**: Agentic fact-checking (ReAct pattern), claim extraction, and summary generation
- **ElevenLabs Turbo v2**: Real-time speech-to-text with support for multiple audio formats (M4A, WAV, MP3)
- **Web Search Integration**: Dynamic information retrieval for fact verification

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

## Setup & Installation

### Prerequisites

- **Python 3.12+** (for backend)
- **Node.js 18+** and **npm** (for frontend)
- **Expo Go app** on your mobile device (iOS/Android)
- **API Keys**:
  - OpenAI API key
  - ElevenLabs API key
  - (Optional) Snowflake credentials for database features

### Backend Setup (Flask)

1. **Navigate to backend directory:**
   ```bash
   cd backend
   ```

2. **Create virtual environment:**
   - **macOS/Linux:**
     ```bash
     python3 -m venv venv
     source venv/bin/activate
     ```
   - **Windows (PowerShell/CMD):**
     ```bash
     python -m venv venv
     venv\Scripts\activate
     ```

3. **Install dependencies:**
   ```bash
   pip install -r requirements.txt
   ```

4. **Configure environment variables:**
   
   Create a `backend/.env` file with the following:
   
   ```bash
   # Required
   OPENAI_API_KEY=sk-...
   ELEVENLABS_API_KEY=sk_...
   
   # Optional (for database features)
   SNOWFLAKE_ACCOUNT=your-account
   SNOWFLAKE_USER=your-username
   SNOWFLAKE_PASSWORD=your-password
   SNOWFLAKE_WAREHOUSE=COMPUTE_WH
   SNOWFLAKE_DATABASE=LIBRA_DB
   SNOWFLAKE_SCHEMA=PUBLIC
   ```

5. **Start the backend server:**
   ```bash
   python app.py
   ```
   
   Server will run at `http://localhost:5001`

### Frontend Setup (React Native + Expo)

1. **Navigate to frontend directory:**
   ```bash
   cd frontend
   ```

2. **Install dependencies:**
   ```bash
   npm install
   ```

3. **Start the development server:**
   ```bash
   npm start
   ```

4. **Run on device:**
   - Scan the QR code with **Expo Go** app (Android) or Camera app (iOS)
   - Or press `i` for iOS simulator / `a` for Android emulator

### Running the Complete System

**You need both servers running simultaneously:**

**Terminal 1 (Backend):**
```bash
cd backend
source venv/bin/activate  # or venv\Scripts\activate on Windows
python app.py
```

**Terminal 2 (Frontend):**
```bash
cd frontend
npm start
```

### Troubleshooting

**CORS Errors:**
- Ensure backend is running on `http://localhost:5001`
- Check that the frontend is configured to use the correct backend URL in `frontend/constants/network.ts`

**Audio Recording Issues:**
- Must test on a physical device (not simulator/emulator)
- Grant microphone permissions when prompted

**API Errors:**
- Verify your `.env` file has valid API keys
- Check backend terminal for detailed error logs

---

## Usage

1. **Start a Debate**: Enter speaker names and topic (optional)
2. **Record Turns**: Pass phone between speakers, each records their argument
3. **View Analysis**: See real-time feedback on fallacies and fact-checks
4. **Review Summary**: View comprehensive post-debate analysis with AI-generated summaries

---

## Project Structure

```
libra/
├── backend/                    # Flask REST API
│   ├── app.py                 # Main Flask application with endpoints
│   ├── factchecker.py         # Fact-checking agent with web search
│   ├── fallacmodel.py         # Fallacy detection logic
│   ├── requirements.txt       # Python dependencies
│   ├── .env                   # Environment variables (not committed)
│   └── services/
│       ├── transcription.py   # ElevenLabs STT integration
│       └── snowflake_service.py # Database operations
│
├── frontend/                   # React Native + Expo mobile app
│   ├── app/                   # Expo Router screens
│   │   ├── index.tsx         # Home screen (debate setup)
│   │   ├── turn.tsx          # Recording screen
│   │   ├── analysis.tsx      # Per-turn analysis results
│   │   └── summary.tsx       # Post-debate summary
│   ├── store/
│   │   └── debateStore.ts    # Zustand state management
│   ├── types/
│   │   └── debate.ts         # TypeScript interfaces
│   ├── constants/
│   │   ├── theme.ts          # Design system colors
│   │   └── network.ts        # API configuration
│   ├── components/           # Reusable UI components
│   └── package.json          # Node dependencies
│
└── README.md                  # This file
```

---

## System Design Highlights

### **Scalability Considerations**
- **Stateless Backend**: Flask API is stateless, enabling horizontal scaling
- **Database Layer**: Snowflake provides cloud-native data warehouse capabilities
- **Async Processing**: Fallacy detection and fact-checking run in parallel for faster response times
- **Caching**: Future implementations can cache common claims and fallacy patterns

### **Error Handling & Reliability**
- **Graceful Degradation**: Analysis failures don't prevent debate continuation
- **Retry Logic**: API calls include exponential backoff for transient failures
- **Validation**: Input validation on both client and server sides
- **Logging**: Comprehensive logging for debugging and monitoring

### **Security & Privacy**
- **No Audio Storage**: Audio files are processed in-memory and immediately discarded
- **API Key Management**: Environment variables prevent key exposure
- **CORS Protection**: Backend restricts cross-origin requests
- **Data Anonymization**: No PII required; debates identified by UUIDs

### **Performance Optimizations**
- **Parallel API Calls**: Fallacy and fact-check endpoints called simultaneously
- **Progressive Loading**: UI updates incrementally as analysis completes
- **Lazy Loading**: Components load on-demand
- **Optimized Animations**: Native driver for 60fps animations

---

## Future Enhancements

- [ ] Multi-language support (Spanish, Mandarin, French)
- [ ] Video debate analysis (YouTube integration)
- [ ] AI opponent mode for solo practice
- [ ] Browser extension for live debate streaming
- [ ] Argument strength scoring algorithm
- [ ] Export debates as PDF reports
- [ ] Social sharing features
- [ ] Advanced analytics dashboard
- [ ] Custom fallacy definitions for educational institutions
- [ ] Integration with debate competition platforms

---

## Contributing

This project was built as part of a hackathon. Contributions, issues, and feature requests are welcome!

### Development Workflow

1. Fork the repository
2. Create a feature branch (`git checkout -b feature/amazing-feature`)
3. Commit your changes (`git commit -m 'Add amazing feature'`)
4. Push to the branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request

### Code Standards

- **Backend**: Follow PEP 8 style guide for Python
- **Frontend**: ESLint configuration enforced (`npm run lint`)
- **TypeScript**: Strict mode enabled
- **Commits**: Use conventional commit messages

---

## License

This project is built for educational purposes as part of a university hackathon.

---

## Acknowledgments

- **OpenAI** for GPT-4 API powering fallacy detection and summarization
- **ElevenLabs** for high-quality speech-to-text transcription
- **Expo** for streamlined React Native development
- **Snowflake** for cloud data warehousing capabilities

