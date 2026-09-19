export const TOPICS = [
  'Arrays',
  'Strings',
  'Linked List',
  'Stack',
  'Queue',
  'Hashing',
  'Trees',
  'Graphs',
  'Dynamic Programming',
  'Greedy',
  'Backtracking',
  'Divide and Conquer',
  'Sorting',
  'Searching',
  'Bit Manipulation',
  'Recursion',
] as const;

export type Topic = (typeof TOPICS)[number];

export const DIFFICULTIES = ['Easy', 'Medium', 'Hard'] as const;
export type Difficulty = (typeof DIFFICULTIES)[number];

export const PLATFORMS = [
  'LeetCode',
  'HackerRank',
  'CodeChef',
  'GeeksforGeeks',
  'Other',
] as const;
export type Platform = (typeof PLATFORMS)[number];

export const STATUSES = [
  'Not Started',
  'Attempted',
  'Solved',
  'Mastered',
] as const;
export type ProblemStatus = (typeof STATUSES)[number];

export interface Problem {
  _id: string;
  user: string;
  title: string;
  description: string;
  topic: Topic;
  difficulty: Difficulty;
  platform: Platform;
  problemUrl: string;
  status: ProblemStatus;
  notes: string;
  tags: string[];
  estimatedTimeMinutes: number;
  lastPracticedAt: string | null;
  createdAt: string;
  updatedAt: string;
}

export interface ProblemFilters {
  search?: string;
  topic?: string;
  difficulty?: string;
  status?: string;
  platform?: string;
  sortBy?: string;
  sortOrder?: 'asc' | 'desc';
}
