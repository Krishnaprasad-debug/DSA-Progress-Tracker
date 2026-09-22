import { Topic } from './problem';

export type GoalType =
  | 'weekly_problems'
  | 'topic_mastery'
  | 'practice_time'
  | 'custom';

export type GoalStatus = 'active' | 'completed' | 'cancelled';

export interface Goal {
  _id: string;
  user: string;
  title: string;
  description?: string;
  type: GoalType;
  targetValue: number;
  currentValue: number;
  progressPercentage: number;
  topic?: Topic;
  deadline?: string | null;
  status: GoalStatus;
  createdAt: string;
  updatedAt: string;
}

export interface CreateGoalDto {
  title: string;
  description?: string;
  type: GoalType;
  targetValue: number;
  topic?: Topic;
  deadline?: string | null;
}

export interface UpdateGoalDto {
  title?: string;
  description?: string;
  targetValue?: number;
  topic?: Topic;
  deadline?: string | null;
  status?: GoalStatus;
  currentValue?: number;
}

export interface GoalsResponse {
  count: number;
  goals: Goal[];
}

export interface DayActivity {
  date: string;
  dayName: string;
  solvedCount: number;
  attemptCount: number;
  practiceTimeMinutes: number;
}

export interface NeglectedWeakTopic {
  topic: string;
  masteryScore: number;
  successRate: number;
  attemptsThisWeek: number;
  recommendation: string;
}

export interface WeeklyReport {
  weekRange: {
    start: string;
    end: string;
  };
  summary: {
    problemsSolved: number;
    totalAttempts: number;
    solvedAttempts: number;
    successRate: number;
    practiceTimeMinutes: number;
    activeDaysCount: number;
  };
  previousWeekComparison: {
    prevProblemsSolved: number;
    prevPracticeTimeMinutes: number;
    prevSuccessRate: number;
    deltaProblemsSolved: number;
    deltaPracticeTimeMinutes: number;
    deltaSuccessRate: number;
    velocityTrend: 'accelerating' | 'steady' | 'declining';
  };
  dailyBreakdown: DayActivity[];
  neglectedWeakTopics: NeglectedWeakTopic[];
  activeGoals: Goal[];
}
