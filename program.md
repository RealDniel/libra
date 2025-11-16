Debate Training Copilot - System Specification
Project Identity

What: Mobile debate coach that analyzes arguments in real-time for logical fallacies and factual accuracy
Platform: React Native + Expo (single phone, shared between speakers)
Users: High school debate teams, Model UN students, casual debaters
NOT: Political fact-checker or truth arbiter (frame as educational tool)
Core User Flow
Setup Phase

    User opens app
    Enters debate topic (optional)
    Sets timer per turn (default 60 seconds)
    Enters Speaker A and Speaker B names
    Presses "Start Debate"

Debate Phase (Repeating Loop)

    Speaker A's Turn
        Timer counts down from 60s
        Red recording indicator visible
        App records audio
        User presses "Switch Speaker" when done (or timer expires)
    Analysis Phase (5-10 seconds)
        App sends audio to backend
        Backend transcribes audio (ElevenLabs)
        Backend analyzes for fallacies and facts
        Results appear in middle display panel:
            ⚠️ Logical fallacies with explanations
            ❌ Factual errors with corrections
            ℹ️ Sources cited
    Speaker B's Turn
        Same flow
        Previous analysis remains visible above
    Repeat until debate ends

Post-Debate Phase

    User presses "End Debate"
    App generates analysis report:
        Full transcript with speaker labels
        Fallacy breakdown (charts)
        Fact accuracy scores per speaker
        Argument quality comparison
        Timeline of key moments
    User can share/export report

UI Structure
Screen 1: Home

    Large "Start New Debate" button
    Settings section (timer, topic)
    List of past debates
    Help/Tutorial link

Screen 2: Debate (Main Interface)

Layout:

┌─────────────────────────┐
│  SPEAKER A    ⏱️ 0:47   │ ← Current speaker + timer
│  [🔴 Recording]         │
├─────────────────────────┤
│  Live Transcript:       │ ← Scrolling text area
│  "I believe climate..." │
├─────────────────────────┤
│  [SWITCH TO SPEAKER B]  │ ← Big primary button
├─────────────────────────┤
│  📊 Analysis Results    │ ← Feedback cards
│                         │
│  ⚠️ Fallacy Detected:   │
│  Hasty Generalization   │
│  "All students" is too  │
│  broad without evidence │
│                         │
│  ❌ Fact Check:         │
│  "unemployment is 50%"  │
│  Actually: 3.8% (BLS)   │
│  [View Source]          │
└─────────────────────────┘

Interactive Elements:

    Timer: Large, visible countdown
    Recording indicator: Pulsing red dot
    Switch button: Disabled during analysis
    Analysis cards: Expandable for more detail
    Transcript: Auto-scrolls to bottom

Screen 3: Analysis Report

    Debate summary card (topic, duration, speakers)
    Side-by-side speaker comparison
    Pie chart: Fallacy types breakdown
    Bar chart: Accuracy scores
    Timeline: Key moments with timestamps
    Export button (share as PDF/image)

Technical Architecture
Frontend (React Native + Expo)

Required Libraries:

    expo-av - Audio recording
    zustand - State management
    react-native-paper - UI components
    react-native-chart-kit - Charts
    axios - API calls

State Management (Zustand):

    Session data: sessionId, topic, speaker names
    Current state: active speaker, timer, recording status
    Debate content: array of turns with transcripts
    Analysis results: fallacies and fact-checks per turn
    UI state: loading, errors, modals

Component Structure:

    Screens: Home, Debate, Analysis
    Components: Timer, AudioRecorder, TranscriptView, FallacyCard, FactCheckCard, AnalysisCharts
    Services: audioService, apiService, storageService
    Types: TypeScript interfaces for all data models

Audio Recording:

    Use expo-av for recording
    Record in 60-second chunks (or until switch button pressed)
    Store audio as base64 or blob in memory
    Send to backend immediately after recording stops

Backend (Node.js + Express)

Endpoints:

POST   /api/debates                      → Create new debate session
GET    /api/debates/:id                  → Get session details
POST   /api/debates/:id/turn             → Submit audio for analysis
GET    /api/debates/:id/turn/:turnId     → Poll for analysis results
POST   /api/debates/:id/end              → Finalize debate, generate report

Services:

    Transcription Service
        Receives audio buffer
        Calls ElevenLabs Speech-to-Text API
        Returns transcript text
    Fallacy Detection Service
        Primary: Call teammate's scikit-learn model (Flask server on port 5000)
        Fallback: Use Claude API with structured prompt
        Returns array of detected fallacies with confidence scores
    Fact-Check Service
        Step 1: Extract claims from text (Claude)
        Step 2: Search for verification (Claude built-in web search OR Brave Search API)
        Step 3: Synthesize results (Claude)
        Returns claims with verdicts and sources

Processing Pipeline:

Audio received
  → Transcribe (ElevenLabs)
  → Store turn in database
  → Launch async analysis:
      → Detect fallacies (parallel)
      → Extract claims (sequential)
      → Verify claims (parallel)
  → Store results in database
  → Frontend polls for completion

Database (PostgreSQL or SQLite)

Tables:

    debates: id, topic, speakerA, speakerB, status, timestamps
    turns: id, debate_id, turn_number, speaker, transcript, audio_url, duration
    fallacies: id, turn_id, type, confidence, explanation, text_segment
    fact_checks: id, turn_id, claim, verdict, corrected_info, sources (JSON), confidence

Data Models
Debate Session

{
  id: string
  topic: string
  speakerA: string
  speakerB: string
  turnDuration: number (seconds)
  status: 'active' | 'completed'
  createdAt: timestamp
  turns: Turn[]
}

Turn

{
  id: string
  speaker: 'A' | 'B'
  turnNumber: number
  transcript: string
  audioUrl: string
  duration: number
  timestamp: number
  analysis: {
    fallacies: Fallacy[]
    factChecks: FactCheck[]
    processed: boolean
  }
}

Fallacy

{
  type: 'ad_hominem' | 'straw_man' | 'false_dichotomy' | 'slippery_slope' | 
        'appeal_to_authority' | 'hasty_generalization' | 'red_herring' | 'circular_reasoning'
  confidence: number (0-1)
  explanation: string
  textSegment: string (which part triggered detection)
}

Fact Check

{
  claim: string (exact quote)
  verdict: 'true' | 'false' | 'misleading' | 'unverifiable'
  correctedInfo: string (if false/misleading)
  explanation: string
  confidence: number (0-1)
  sources: [
    {
      title: string
      url: string
      excerpt: string
      date: string
    }
  ]
}

AI Integration Specifications
1. ElevenLabs Transcription

    API: ElevenLabs Speech-to-Text
    Model: eleven_turbo_v2 (fastest)
    Input: Audio buffer (base64 or binary)
    Output: Plain text transcript
    Error Handling: If fails, retry once; if fails again, return error to user

2. Fallacy Detection

Option A: Scikit-learn Model (Primary)

    Teammate builds separate Flask server
    Exposes POST endpoint: /detect
    Input: { "text": "..." }
    Output: { "fallacies": [...] }
    Backend calls this via HTTP

Option B: Claude API (Fallback)

    Use Claude Sonnet 4
    Structured prompt requesting JSON output
    Only report fallacies with confidence > 0.7
    Parse JSON response

Fallacy Types:

    Ad Hominem: Attacking person not argument
    Straw Man: Misrepresenting opponent
    False Dichotomy: Only two options presented
    Slippery Slope: Chain reaction assumption
    Appeal to Authority: Citing irrelevant authority
    Hasty Generalization: Insufficient evidence
    Red Herring: Changing subject
    Circular Reasoning: Conclusion assumes premise

3. Fact-Checking

Step 1: Claim Extraction

    Use Claude API
    Input: Full transcript text
    Prompt: Extract specific, verifiable factual claims
    Output: Array of claims with type labels

Step 2: Verification

Option A: Claude Built-in Web Search (Recommended)

    Use Claude with web_search_20250305 tool
    Claude automatically searches and synthesizes
    Simpler integration, fewer API keys needed

Option B: Brave Search API

    Search Brave for each claim
    Pass results to Claude for synthesis
    Requires separate API key

Output Format:

    Verdict (true/false/misleading/unverifiable)
    Corrected information if wrong
    Brief explanation
    1-3 authoritative sources with URLs

Critical Implementation Rules
DO:

✅ Test audio recording on physical device immediately (Day 1, Hour 1)
✅ Handle all API errors gracefully with user-friendly messages
✅ Show loading states during analysis (spinner, "Analyzing...")
✅ Store debates locally for offline viewing of past sessions
✅ Use TypeScript for all frontend and backend code
✅ Implement proper async/await patterns for API calls
✅ Add retry logic for network requests (max 2 retries)
✅ Validate all user inputs before sending to backend
✅ Display confidence scores for fallacies and fact-checks
✅ Make sources clickable (open in browser)
✅ Use environment variables for all API keys
✅ Implement proper error boundaries in React
✅ Test full flow 5+ times before demo
DON'T:

❌ Don't use mock/fake data in production app
❌ Don't promise "100% accurate fact-checking"
❌ Don't interrupt speakers with buzzer sounds during their turn
❌ Don't store audio files permanently (privacy concern)
❌ Don't make UI claims you can't deliver (e.g., "real-time" if 10s delay)
❌ Don't ignore low confidence results - show them but mark as uncertain
❌ Don't block UI while waiting for analysis - use async updates
❌ Don't hardcode API keys in source code
❌ Don't skip error handling "to save time"
❌ Don't over-complicate UI with too many features
❌ Don't add animations/polish before core features work
❌ Don't assume network is always available
Environment Configuration
Backend .env

ELEVENLABS_API_KEY=sk_...
ANTHROPIC_API_KEY=sk-ant-...
USE_CLAUDE_SEARCH=true
DATABASE_URL=postgresql://...
PORT=3000
NODE_ENV=development

Optional if not using Claude search:

BRAVE_API_KEY=BSA...

Mobile .env

EXPO_PUBLIC_API_URL=http://192.168.1.X:3000

(Replace X with your local IP)
24-Hour Build Timeline
Hours 0-6: Foundation

    Expo project setup
    Navigation structure
    Timer UI
    Speaker switching logic
    State management (Zustand)
    Milestone: Can start debate, see timer, switch speakers

Hours 6-10: Audio

    Configure expo-av
    Implement recording service
    Test on physical device
    Send audio to backend
    Milestone: Audio recording works reliably

Hours 10-14: Transcription

    Backend server setup
    ElevenLabs integration
    Display transcript in UI
    Error handling
    Milestone: Audio → Text working

Hours 14-17: Fallacy Detection

    Integrate scikit-learn model OR Claude fallback
    Display fallacies in UI
    Add explanations
    Milestone: Fallacies detected and shown

Hours 17-20: Fact-Checking

    Claim extraction
    Web search integration
    Verification logic
    Display results with sources
    Milestone: False claims caught and corrected

Hours 20-22: Post-Debate Analysis

    Generate final report
    Create visualizations
    Calculate scores
    Export functionality
    Milestone: Beautiful analysis report

Hours 22-24: Polish & Demo Prep

    UI refinements
    Loading states
    Error messages
    Full flow testing
    Demo script preparation
    Record backup video
    Milestone: Ready to present

Success Criteria
Minimum Viable Demo:

    Two people can record turns
    Transcripts appear correctly
    At least 1 fallacy detected and explained
    At least 1 fact checked with source shown
    App doesn't crash during 5-turn debate

Ideal Demo:

    All of above +
    Post-debate analysis screen with charts
    Smooth UI with animations
    Clear error handling
    Works on first try during presentation

Risk Management
Critical Risks:

Risk 1: Audio fails on iOS

    Test TODAY on actual iPhone
    Fallback: Text input mode ("Type your argument")
    Have backup video demo ready

Risk 2: Scikit-learn model not ready

    Claude fallback already specified
    Decision point: Hour 18 (if model not done, switch to Claude)

Risk 3: Analysis too slow (>15 seconds)

    Optimize: Run fallacy + fact-check in parallel
    Show progressive results: transcript → fallacies → facts
    Set user expectation: "Analysis takes 5-10 seconds"

Risk 4: API rate limits during demo

    Cache common test queries
    Have offline mode with pre-loaded results
    Use backup video if APIs fail

Risk 5: Judge tests controversial political claim

    Response prepared: "We provide sources and let users verify - we're educational, not authoritative"

Judge Scoring Strategy
Innovation (Target: 8/10)

    Pitch: "First mobile debate coach with real-time AI analysis"
    Differentiator: Turn-based physical interaction (passing phone)
    Boost: Add unique "Common Ground Finder" feature if time

Originality (Target: 7/10)

    Challenge: Fact-checkers exist
    Defense: "We're not fact-checking news - we're training debaters"
    Boost: Educational framing makes this more original

Practicality (Target: 9/10)

    Strength: Clear users (debate teams, students)
    Evidence: "High school debate coaches would pay for this"
    Boost: Have go-to-market plan ready

Execution (Target: 8/10)

    Critical: Demo must work flawlessly
    Preparation: Test 10+ times before presenting
    Safety: Have backup video ready

Learning (Target: 8/10)

    Story: "We learned multi-modal AI, real-time audio, mobile dev, agent orchestration"
    Technical depth: Mention specific challenges overcome

Target Total: 40/50 = Strong contender for top 3
Demo Script (2 Minutes)

Problem (15s): "Debates are full of logical errors and false claims. Students don't get instant feedback to improve."

Solution (15s): "We built an AI debate coach. Two people pass one phone, argue in turns, and get instant analysis of fallacies and facts."

Demo (75s):

    Show home screen, press start
    Person A argues (with intentional fallacy)
    Press switch, show analysis appearing
    Person B argues (with false statistic)
    Show fact-check correction with source
    End debate, show beautiful report

Impact (15s): "This helps students practice critical thinking. Imagine every debate team having this coach in their pocket."
Post-Hackathon Path

If judges ask "what's next?":

    Expand to video debate analysis (YouTube integration)
    Add practice mode: debate against AI
    Multi-language support
    Browser extension for live debates
    Licensing to schools and universities

