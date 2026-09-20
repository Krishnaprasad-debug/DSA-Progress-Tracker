import { Problem } from './problem';

export type RevisionInterval = 1 | 7 | 30;

export interface Revision {
  _id: string;
  problem: Problem;
  user: string;
  scheduledDate: string;
  intervalDays: RevisionInterval;
  completed: boolean;
  completedAt: string | null;
  createdAt: string;
  updatedAt: string;
}

export interface RevisionsResponse {
  count: number;
  revisions: Revision[];
}

export interface CompleteRevisionResponse {
  message: string;
  completedRevision: Revision;
  nextRevision: Revision | null;
  mastered: boolean;
}

export interface CreateRevisionInput {
  problemId: string;
  intervalDays?: RevisionInterval;
  scheduledDate?: string;
}
