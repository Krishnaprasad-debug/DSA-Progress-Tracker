export interface DifficultyStats {
  total: number;
  solved: number;
}

export interface RecentActivityItem {
  _id: string;
  problemTitle: string;
  topic: string;
  difficulty: string;
  result: string;
  timeTakenMinutes: number;
  attemptedAt: string;
}

export interface DashboardAnalytics {
  totalProblems: number;
  totalSolved: number;
  totalAttempted: number;
  totalMastered: number;
  byDifficulty: {
    Easy: DifficultyStats;
    Medium: DifficultyStats;
    Hard: DifficultyStats;
  };
  totalAttempts: number;
  totalSolvedAttempts: number;
  overallSuccessRate: number;
  totalPracticeTimeMinutes: number;
  currentStreak: number;
  longestStreak: number;
  activeToday: boolean;
  weakTopicsCount: number;
  recentActivity: RecentActivityItem[];
}

export interface TopicAnalytics {
  topic: string;
  totalProblems: number;
  solvedCount: number;
  attemptCount: number;
  successfulAttempts: number;
  successRate: number;
  masteryScore: number;
  volumeScore: number;
  difficultyWeight: number;
  isWeak: boolean;
  weakReasons: string[];
}

export interface TopicAnalyticsResponse {
  count: number;
  topics: TopicAnalytics[];
}

export interface StreakAnalytics {
  currentStreak: number;
  longestStreak: number;
  activeToday: boolean;
  history: Record<string, number>;
}
