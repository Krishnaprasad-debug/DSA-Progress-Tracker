import { Problem } from './problem';

export type AssessmentStatus =
  | 'configured'
  | 'in_progress'
  | 'completed'
  | 'expired';

export type AssessmentVerdict =
  | 'strong_hire'
  | 'hire'
  | 'leaning_hire'
  | 'needs_practice'
  | 'pending';

export type ProblemAssessmentStatus = 'unsolved' | 'solved' | 'failed';

export interface AssessmentProblem {
  _id: string;
  problem: Problem;
  pointWeight: number;
  status: ProblemAssessmentStatus;
  attempts: number;
  timeTakenMinutes: number;
  solvedAt?: string | null;
  notes?: string;
}

export interface Assessment {
  _id: string;
  user: string;
  title: string;
  description?: string;
  durationMinutes: number;
  status: AssessmentStatus;
  problems: AssessmentProblem[];
  startTime?: string | null;
  endTime?: string | null;
  score: number;
  maxScore: number;
  timeSpentMinutes: number;
  verdict: AssessmentVerdict;
  notes?: string;
  createdAt: string;
  updatedAt: string;
}

export interface AssessmentDetailsResponse {
  assessment: Assessment;
  remainingSeconds: number;
}

export interface CreateAssessmentDto {
  title: string;
  description?: string;
  durationMinutes?: number;
  problemIds: string[];
}

export interface SubmitAssessmentAttemptDto {
  problemId: string;
  result: 'Solved' | 'Failed';
  timeTakenMinutes: number;
  notes?: string;
}
