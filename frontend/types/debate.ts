/**
 * Libra - Debate Types
 */

export type Speaker = 'A' | 'B';

export type DebateStatus = 'idle' | 'active' | 'completed';

export type TurnStatus = 'idle' | 'recording' | 'uploading' | 'analyzing' | 'complete';

export type FallacyVerdict = 'detected';

export type FactCheckVerdict = 'true' | 'false' | 'misleading' | 'unverifiable';

export interface Fallacy {
  id: string;
  type: string;
  confidence: number;
  explanation: string;
  textSegment?: string;
}

export interface FactCheck {
  id: string;
  claim: string;
  verdict: FactCheckVerdict;
  correctedInfo?: string;
  explanation: string;
  confidence: number;
  sources?: Array<{
    title: string;
    url: string;
    excerpt?: string;
  }>;
}

export interface Turn {
  id: string;
  speaker: Speaker;
  turnNumber: number;
  duration: number;
  transcript?: string;
  fallacies: Fallacy[];
  factChecks: FactCheck[];
  audioUri?: string;
  createdAt: Date;
}

export interface DebateSession {
  id: string;
  status: DebateStatus;
  turns: Turn[];
  createdAt: Date;
  completedAt?: Date;
}

export interface CurrentTurn {
  speaker: Speaker;
  status: TurnStatus;
  timeRemaining: number;
  startedAt?: Date;
  audioUri?: string;
  transcript?: string;
  fallacies?: Fallacy[];
  factChecks?: FactCheck[];
  error?: string;
}

