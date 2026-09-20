export const ATTEMPT_RESULTS = ['Solved', 'Failed'] as const;
export type AttemptResult = (typeof ATTEMPT_RESULTS)[number];

export interface Attempt {
  _id: string;
  problem: string;
  user: string;
  attemptNumber: number;
  result: AttemptResult;
  timeTakenMinutes: number;
  notes: string;
  attemptedAt: string;
  createdAt: string;
  updatedAt: string;
}

export interface StruggleStatus {
  isStruggle: boolean;
  reasons: string[];
}

export interface CreateAttemptInput {
  result: AttemptResult;
  timeTakenMinutes: number;
  notes?: string;
}

export interface ProblemAttemptsResponse {
  attempts: Attempt[];
  struggleStatus: StruggleStatus;
  problem: {
    _id: string;
    title: string;
    topic: string;
    difficulty: string;
    status: string;
    lastPracticedAt: string | null;
  };
}

export interface CreateAttemptResponse {
  message: string;
  attempt: Attempt;
  problemStatus: string;
  struggleStatus: StruggleStatus;
}
