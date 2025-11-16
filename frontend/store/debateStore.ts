/**
 * Libra - Debate State Store (Zustand)
 */

import { create } from 'zustand';
import { router } from 'expo-router';
import type {
  DebateSession,
  CurrentTurn,
  Turn,
  Speaker,
  Fallacy,
  FactCheck,
} from '@/types/debate';

interface DebateStore {
  // Session state
  session: DebateSession | null;
  currentTurn: CurrentTurn | null;

  // Config
  turnDurationSeconds: number;

  // Speaker names (optional)
  speakerNames?: { A?: string; B?: string } | null;

  // Actions
  startDebate: () => void;
  startTurn: (speaker: Speaker, durationSeconds?: number, names?: { A?: string; B?: string }) => void;
  setTurnDuration?: (seconds: number) => void;
  setSpeakerNames?: (names: { A?: string; B?: string }) => void;
  updateTimer: (timeRemaining: number) => void;
  setRecording: (isRecording: boolean, audioUri?: string) => void;
  setUploading: () => void;
  setTranscript: (transcript: string) => void;
  setAnalysis: (fallacies: Fallacy[], factChecks: FactCheck[]) => void;
  setError: (error: string) => void;
  completeTurn: () => void;
  nextSpeaker: () => void;
  endDebate: () => void;
  reset: () => void;
}

export const useDebateStore = create<DebateStore>((set, get) => ({
  // Initial state
  session: null,
  currentTurn: null,
  speakerNames: { A: 'Speaker A', B: 'Speaker B' },
  turnDurationSeconds: 60,

  // Start a new debate session
  startDebate: () => {
    const sessionId = `debate-${Date.now()}`;
    set({
      session: {
        id: sessionId,
        status: 'active',
        turns: [],
        createdAt: new Date(),
      },
    });
  },

  // Set turn duration (seconds)
  setTurnDuration: (seconds: number) => {
    set({ turnDurationSeconds: seconds });
  },

  // Set speaker display names
  setSpeakerNames: (names: { A?: string; B?: string }) => {
    set((state) => ({ speakerNames: { ...(state.speakerNames || {}), ...names } }));
  },

  // Start a new turn for a speaker
  startTurn: (speaker: Speaker, durationSeconds?: number, names?: { A?: string; B?: string }) => {
    const { turnDurationSeconds } = get();
    const duration = durationSeconds ?? turnDurationSeconds;

    // Optionally update speaker names for this session
    if (names && Object.keys(names).length) {
      set((state) => ({ speakerNames: { ...(state.speakerNames || {}), ...names } }));
    }

    set({
      currentTurn: {
        speaker,
        status: 'idle',
        timeRemaining: duration,
        startedAt: new Date(),
      },
    });
  },

  // Update timer countdown
  updateTimer: (timeRemaining: number) => {
    set((state) => {
      if (!state.currentTurn) return state;
      return {
        currentTurn: {
          ...state.currentTurn,
          timeRemaining,
        },
      };
    });
  },

  // Set recording state
  setRecording: (isRecording: boolean, audioUri?: string) => {
    set((state) => {
      if (!state.currentTurn) return state;
      return {
        currentTurn: {
          ...state.currentTurn,
          status: isRecording ? 'recording' : 'idle',
          audioUri,
        },
      };
    });
  },

  // Set uploading state
  setUploading: () => {
    set((state) => {
      if (!state.currentTurn) return state;
      return {
        currentTurn: {
          ...state.currentTurn,
          status: 'uploading',
        },
      };
    });
  },

  // Set transcript after upload
  setTranscript: (transcript: string) => {
    set((state) => {
      if (!state.currentTurn) return state;
      return {
        currentTurn: {
          ...state.currentTurn,
          status: 'analyzing',
          transcript,
        },
      };
    });
  },

  // Set analysis results
  setAnalysis: (fallacies: Fallacy[], factChecks: FactCheck[]) => {
    set((state) => {
      if (!state.currentTurn) return state;
      return {
        currentTurn: {
          ...state.currentTurn,
          status: 'complete',
        },
      };
    });
  },

  // Set error state
  setError: (error: string) => {
    set((state) => {
      if (!state.currentTurn) return state;
      return {
        currentTurn: {
          ...state.currentTurn,
          status: 'idle',
          error,
        },
      };
    });
  },

  // Complete the current turn and add to session
  completeTurn: () => {
    set((state) => {
      if (!state.session || !state.currentTurn) return state;

      const turn: Turn = {
        id: `turn-${Date.now()}`,
        speaker: state.currentTurn.speaker,
        turnNumber: state.session.turns.length + 1,
        duration: state.turnDurationSeconds - state.currentTurn.timeRemaining,
        transcript: state.currentTurn.transcript,
        fallacies: [], // Will be filled from analysis
        factChecks: [], // Will be filled from analysis
        audioUri: state.currentTurn.audioUri,
        createdAt: new Date(),
      };

      return {
        session: {
          ...state.session,
          turns: [...state.session.turns, turn],
        },
      };
    });
  },

  // Move to next speaker
  nextSpeaker: () => {
    const { currentTurn, startTurn } = get();
    if (!currentTurn) return;

    const nextSpeaker: Speaker = currentTurn.speaker === 'A' ? 'B' : 'A';
    startTurn(nextSpeaker);
  },

  // End the debate
  endDebate: () => {
    set((state) => {
      if (!state.session) return state;
      return {
        session: {
          ...state.session,
          status: 'completed',
          completedAt: new Date(),
        },
        currentTurn: null,
      };
    });
    // Navigate to summary after marking the session completed
    router.push('/summary');
  },

  // Reset everything
  reset: () => {
    set({
      session: null,
      currentTurn: null,
    });
  },
}));

