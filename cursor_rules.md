Cursor Rules - Debate Training Copilot
Project Overview

React Native debate coach app. Two people pass one phone, take 60s turns speaking. AI analyzes for fallacies and fact errors. 24-hour hackathon build.
Code Standards
TypeScript Everywhere

    Strict mode, no any types
    Interfaces in types/index.ts
    Props: ComponentNameProps format

React Native

    Functional components + hooks only
    One component per file
    Zustand for state (single store)

File Naming

    Components: PascalCase.tsx
    Services: camelCase.ts
    Types: PascalCase

Imports Order
typescript

import React from 'react';           // React first
import { View } from 'react-native'; // RN/third-party
import Component from '@/components'; // Local
import { service } from '@/services'; // Services
import type { Type } from '@/types';  // Types last

Critical Rules
ALWAYS:

✅ Try-catch all API calls
✅ Show loading states
✅ Validate inputs
✅ Use env variables for keys
✅ Handle errors with user messages
✅ Keep components under 200 lines
✅ Return early on errors
NEVER:

❌ Ignore errors silently
❌ Block UI thread
❌ Hardcode API keys
❌ Use console.log in production
❌ Create god components
❌ Commit broken code
❌ Trust user input without validation
Audio & Transcription (ElevenLabs)
Simple Implementation

ElevenLabs handles everything - we just need basic recording + API call.
Recording Pattern
typescript

// Use expo-av for simple recording:
import { Audio } from 'expo-av';

// 1. Request permissions once at app start
await Audio.requestPermissionsAsync();

// 2. Start recording (on speaker's turn)
const recording = new Audio.Recording();
await recording.prepareToRecordAsync(Audio.RecordingOptionsPresets.HIGH_QUALITY);
await recording.startAsync();

// 3. Stop recording (when Switch button pressed or 60s timeout)
await recording.stopAndUnloadAsync();
const uri = recording.getURI();

// 4. Send to backend
const formData = new FormData();
formData.append('audio', {
  uri,
  type: 'audio/m4a',
  name: 'recording.m4a'
});
await apiService.submitTurn(sessionId, formData);

ElevenLabs API Call (Backend)
typescript

// Backend service: services/transcription.ts
import { ElevenLabsClient } from 'elevenlabs';

const client = new ElevenLabsClient({
  apiKey: process.env.ELEVENLABS_API_KEY
});

export async function transcribeAudio(audioBuffer: Buffer): Promise<string> {
  try {
    const result = await client.speechToText.convert({
      audio: audioBuffer,
      model_id: 'eleven_turbo_v2'  // Fastest model
    });
    
    return result.text;
  } catch (error) {
    console.error('ElevenLabs transcription failed:', error);
    throw new Error('Transcription failed - please try again');
  }
}

Error Handling

    If transcription fails: Show error, let user re-record
    If transcript empty: "No speech detected - please speak louder"
    If API key invalid: Check env vars immediately

API Pattern
typescript

try {
  setLoading(true);
  const res = await axios.post(url, data, { timeout: 30000 });
  return res.data;
} catch (error) {
  if (axios.isAxiosError(error)) {
    if (error.code === 'ECONNABORTED') throw new Error('Timeout');
    if (error.response) throw new Error(error.response.data.message);
    throw new Error('Network error');
  }
  throw error;
} finally {
  setLoading(false);
}

Retry once after 2s on failure.
Component Structure

Every screen needs:

    Loading state (spinner)
    Error state (retry button)
    Empty state (helpful message)
    Success state (main content)

State Management
typescript

// Zustand store structure:
{
  session: { id, topic, speakers, status },
  currentTurn: { speaker, timeRemaining, isRecording, transcript },
  turns: Turn[],
  ui: { isAnalyzing, error, currentView },
  
  // Actions (verbs)
  startDebate: () => void,
  switchSpeaker: () => void,
  endDebate: () => void
}

Immutable updates. Compute derived state, don't store it.
AI Integration
ElevenLabs (Transcription)

    Model: eleven_turbo_v2 (fastest)
    Retry once on fail with 2s delay
    Max file size: 10MB
    Supported formats: WAV, MP3, M4A, FLAC
    Timeout: 30s max

Claude (Analysis)

    Model: claude-sonnet-4-20250514
    Request JSON output explicitly in prompt
    Parse response carefully (handle malformed JSON)
    Max tokens: 2048 for analysis, 4096 for fact-checking
    Always set temperature: 0.3 (more deterministic)

Fallacy Detection
typescript

// Primary: Teammate's scikit-learn model
POST http://localhost:5000/detect
Body: { "text": "..." }
Response: { "fallacies": [...] }

// Fallback: Claude API
const prompt = `Analyze for logical fallacies. Return JSON only:
[{"type": "fallacy_name", "confidence": 0.0-1.0, "explanation": "...", "text_segment": "..."}]

Text: "${text}"

Common fallacies: ad_hominem, straw_man, false_dichotomy, slippery_slope, 
appeal_to_authority, hasty_generalization, red_herring, circular_reasoning.

Only report confidence > 0.7. Return ONLY JSON array.`;

Only show fallacies with confidence > 0.7.
Fact-Checking (3-Step Process)
typescript

// Step 1: Extract claims (Claude)
const extractPrompt = `Extract verifiable factual claims from this text.
Return JSON: {"claims": [{"claim": "exact quote", "type": "statistic|fact|event"}]}
Only specific, checkable claims - no opinions.
Text: "${text}"`;

// Step 2: Search for each claim
// Option A: Claude built-in search (recommended)
await client.messages.create({
  model: 'claude-sonnet-4-20250514',
  tools: [{ type: 'web_search_20250305', name: 'web_search' }],
  messages: [{ role: 'user', content: `Verify: "${claim}"` }]
});

// Option B: Brave Search API
const searchResults = await axios.get('https://api.search.brave.com/res/v1/web/search', {
  params: { q: claim, count: 5 },
  headers: { 'X-Subscription-Token': process.env.BRAVE_API_KEY }
});

// Step 3: Synthesize verdict (Claude)
const verifyPrompt = `Verify claim: "${claim}"
Sources: ${JSON.stringify(sources)}
Return JSON: {
  "verdict": "true|false|misleading|unverifiable",
  "corrected_info": "...",
  "explanation": "...",
  "confidence": 0.0-1.0,
  "sources": [{"title": "...", "url": "...", "excerpt": "..."}]
}`;

Critical: Only mark "false" if confidence > 0.85. Use "misleading" or "unverifiable" for uncertain cases.
Performance Optimizations
Parallel Processing
typescript

// Run fallacy detection and fact-checking simultaneously
const [fallacies, factChecks] = await Promise.all([
  detectFallacies(transcript),
  verifyFacts(transcript)
]);

Caching
typescript

// Cache fact-check results (in-memory Map or Redis)
const factCache = new Map<string, FactCheck>();

async function verifyFacts(text: string): Promise<FactCheck[]> {
  const cacheKey = text.toLowerCase().trim();
  if (factCache.has(cacheKey)) {
    return factCache.get(cacheKey)!;
  }
  
  const results = await performFactCheck(text);
  factCache.set(cacheKey, results);
  return results;
}

Progressive Loading
typescript

// Show results as they arrive (don't wait for everything)
// 1. Show transcript immediately
setTranscript(text);

// 2. Show fallacies when ready (~2-3s)
const fallacies = await detectFallacies(text);
setFallacies(fallacies);

// 3. Show fact-checks when ready (~5-8s)
const facts = await verifyFacts(text);
setFactChecks(facts);

Database Schema
debates table
sql

id UUID PRIMARY KEY
topic TEXT
speaker_a TEXT
speaker_b TEXT
turn_duration INTEGER DEFAULT 60
status TEXT CHECK (status IN ('active', 'completed'))
created_at TIMESTAMP DEFAULT NOW()

turns table
sql

id UUID PRIMARY KEY
debate_id UUID REFERENCES debates(id)
turn_number INTEGER
speaker TEXT CHECK (speaker IN ('A', 'B'))
transcript TEXT
audio_url TEXT
duration INTEGER
created_at TIMESTAMP DEFAULT NOW()

fallacies table
sql

id UUID PRIMARY KEY
turn_id UUID REFERENCES turns(id)
type TEXT
confidence FLOAT
explanation TEXT
text_segment TEXT

fact_checks table
sql

id UUID PRIMARY KEY
turn_id UUID REFERENCES turns(id)
claim TEXT
verdict TEXT CHECK (verdict IN ('true', 'false', 'misleading', 'unverifiable'))
corrected_info TEXT
explanation TEXT
confidence FLOAT
sources JSONB

Error Handling Strategy
User-Facing Errors

Never show technical details. Map to friendly messages:
typescript

const ERROR_MESSAGES = {
  'ECONNABORTED': 'Request timed out. Please try again.',
  'NETWORK_ERROR': 'Check your internet connection.',
  'TRANSCRIPTION_FAILED': 'Could not transcribe audio. Please speak clearly and try again.',
  'ANALYSIS_FAILED': 'Analysis service unavailable. Retrying...',
  'INVALID_INPUT': 'Please check your input and try again.',
  'RATE_LIMIT': 'Too many requests. Please wait a moment.'
};

Retry Logic
typescript

async function withRetry<T>(
  fn: () => Promise<T>,
  maxRetries = 1,
  delayMs = 2000
): Promise<T> {
  try {
    return await fn();
  } catch (error) {
    if (maxRetries > 0) {
      await new Promise(resolve => setTimeout(resolve, delayMs));
      return withRetry(fn, maxRetries - 1, delayMs);
    }
    throw error;
  }
}

Testing Priorities
Must Test:

    Full turn flow: Record → Transcribe → Analyze → Display (3x minimum)
    Error cases: Network drop, API failure, timeout
    Edge cases: Silent audio, very long speech, multiple speakers
    Switch speaker: Works mid-recording, works after timeout
    End debate: Generates report correctly

Nice to Test:

    Multiple debates in sequence
    App backgrounding during analysis
    Very long debates (10+ turns)

Hackathon Time Management
Hours 0-6: Core UI

    Screens: Home, Debate, Analysis
    Timer component (counts down from 60s)
    Switch Speaker button
    State management setup

Deliverable: Can navigate screens, see timer countdown
Hours 6-10: Audio + Transcription

    Request audio permissions
    Record audio (expo-av)
    Backend endpoint: POST /api/debates/:id/turn
    ElevenLabs integration
    Display transcript

Deliverable: Speak → see text appear
Hours 10-14: Fallacy Detection

    Connect to teammate's ML model OR implement Claude fallback
    Parse fallacy results
    Display FallacyCard component
    Show explanations

Deliverable: Fallacies detected and shown
Hours 14-18: Fact-Checking

    Claim extraction (Claude)
    Web search integration (Claude search OR Brave)
    Verification synthesis
    Display FactCheckCard with sources

Deliverable: False claims caught with corrections
Hours 18-20: Post-Debate Report

    Calculate scores (fallacies, accuracy per speaker)
    Generate charts (pie chart, bar chart)
    Timeline of key moments
    Export/share functionality

Deliverable: Beautiful analysis screen
Hours 20-22: Polish

    Loading states everywhere
    Error messages user-friendly
    Smooth transitions
    Colors, fonts, spacing

Hours 22-24: Demo Prep

    Test full flow 5+ times
    Record backup video
    Prepare pitch (under 2 min)
    Pre-load test debate
    Practice with team

Cut Features If Behind

Priority order (cut from bottom up):

    ❌ Charts in analysis report (use text summary)
    ❌ Fact-checking (keep fallacy detection)
    ❌ Post-debate report (just show transcript + results)
    ❌ Multiple debate history (just current session)

Minimum viable demo:

    Record turns
    Show transcript
    Detect 1+ fallacy with explanation
    Don't crash

Emergency Fallbacks
If APIs Fail During Demo:

    Have backup video ready
    Use cached results from testing
    Show pre-recorded demo
    Explain: "Live APIs hit rate limit, here's recorded version"

If Teammate's ML Model Not Ready:

    Use Claude fallback (already designed)
    Don't mention it was supposed to be custom
    Focus on fact-checking as differentiator

If Analysis Too Slow:

    Show progressive results (transcript → fallacies → facts)
    Set expectation: "Analysis takes 5-10 seconds"
    Add "Skip analysis" button for demo speed

Pre-Demo Checklist (30 min before)

    Full flow tested 3x without errors
    Backup video on laptop
    Phone fully charged
    WiFi/data verified strong
    All API keys valid and funded
    Error messages are friendly
    Team knows demo roles
    Pitch memorized and timed
    Pre-loaded test debate ready
    Answers prepared for judge questions

Judge Q&A Prep

Q: "How accurate is fact-checking?"
A: "We provide sources so users can verify. We're an assistant, not an arbiter."

Q: "What if your fallacy detector is wrong?"
A: "We only show high-confidence results and explain our reasoning."

Q: "This seems biased toward [political side]"
A: "We're educational, not political. We show sources from multiple perspectives."

Q: "What's your tech stack?"
A: "React Native, ElevenLabs for transcription, Claude for analysis, [mention ML model if ready]"
Key Principles

    Working demo > perfect code
    3 features working > 5 broken
    Show, don't tell (live demo beats explanation)
    Have backup plans for everything
    Test constantly on real device
    Prioritize ruthlessly - cut features early if behind

