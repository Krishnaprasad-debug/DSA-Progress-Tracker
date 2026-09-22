import { Types } from 'mongoose';
import { Problem, TOPICS, Topic } from '../models/Problem';
import { Attempt } from '../models/Attempt';

export interface TopicMasteryInput {
  solvedCount: number;
  totalAttempts: number;
  successfulAttempts: number;
  easySolved: number;
  mediumSolved: number;
  hardSolved: number;
}

export interface TopicMasteryResult {
  masteryScore: number;
  volumeScore: number;
  successRate: number;
  difficultyWeight: number;
}

export interface WeakTopicResult {
  isWeak: boolean;
  reasons: string[];
}

export interface StreakResult {
  currentStreak: number;
  longestStreak: number;
  activeToday: boolean;
  history: Record<string, number>;
}

export interface TopicStatItem {
  topic: Topic;
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

export interface DashboardAnalyticsResult {
  totalProblems: number;
  totalSolved: number;
  totalAttempted: number;
  totalMastered: number;
  byDifficulty: {
    Easy: { total: number; solved: number };
    Medium: { total: number; solved: number };
    Hard: { total: number; solved: number };
  };
  totalAttempts: number;
  totalSolvedAttempts: number;
  overallSuccessRate: number;
  totalPracticeTimeMinutes: number;
  currentStreak: number;
  longestStreak: number;
  activeToday: boolean;
  weakTopicsCount: number;
  recentActivity: Array<{
    _id: string;
    problemTitle: string;
    topic: string;
    difficulty: string;
    result: string;
    timeTakenMinutes: number;
    attemptedAt: Date;
  }>;
}

/**
 * Calculates Topic Mastery Score (0 - 100%) using the deterministic formula:
 * Mastery = min(100, round(S * 0.40 + R * 0.35 + D * 0.25))
 * - S (Volume) = min(100, (Solved / 15) * 100)
 * - R (Success Rate) = (Successful Attempts / Total Attempts) * 100
 * - D (Difficulty Weight) = ((Easy * 1) + (Medium * 2) + (Hard * 3)) / (max(1, Total Solved) * 3) * 100
 */
export function calculateTopicMastery(input: TopicMasteryInput): TopicMasteryResult {
  const {
    solvedCount,
    totalAttempts,
    successfulAttempts,
    easySolved,
    mediumSolved,
    hardSolved,
  } = input;

  // 1. S (Volume)
  const volumeScore = Math.min(100, (solvedCount / 15) * 100);

  // 2. R (Success Rate)
  const successRate =
    totalAttempts > 0 ? (successfulAttempts / totalAttempts) * 100 : 0;

  // 3. D (Difficulty Weight)
  const totalSolved = Math.max(1, solvedCount);
  const difficultyWeight =
    solvedCount > 0
      ? (((easySolved * 1) + (mediumSolved * 2) + (hardSolved * 3)) /
          (totalSolved * 3)) *
        100
      : 0;

  // Composite Mastery Score
  const rawScore =
    volumeScore * 0.40 + successRate * 0.35 + difficultyWeight * 0.25;

  const masteryScore = Math.min(100, Math.round(rawScore));

  return {
    masteryScore,
    volumeScore: Math.round(volumeScore),
    successRate: Math.round(successRate),
    difficultyWeight: Math.round(difficultyWeight),
  };
}

/**
 * Flags a topic as Weak if:
 * User has attempted >= 3 problems in that topic AND (Mastery Score < 50% OR Success Rate < 50%).
 */
export function identifyWeakTopic(
  attemptCount: number,
  masteryScore: number,
  successRate: number
): WeakTopicResult {
  const reasons: string[] = [];

  if (attemptCount >= 3) {
    if (masteryScore < 50) {
      reasons.push(`Mastery score is ${masteryScore}% (below 50% threshold).`);
    }
    if (successRate < 50) {
      reasons.push(`Practice success rate is ${successRate}% (below 50% threshold).`);
    }
  }

  return {
    isWeak: reasons.length > 0,
    reasons,
  };
}

/**
 * Computes currentStreak and longestStreak based on daily recorded attempts normalized to UTC midnight.
 */
export function calculateStreaks(dates: Array<Date | string | number>): StreakResult {
  const history: Record<string, number> = {};

  if (!dates || dates.length === 0) {
    return {
      currentStreak: 0,
      longestStreak: 0,
      activeToday: false,
      history: {},
    };
  }

  // Normalize each date to YYYY-MM-DD string in UTC
  for (const item of dates) {
    const d = new Date(item);
    if (!isNaN(d.getTime())) {
      const dateStr = d.toISOString().split('T')[0];
      history[dateStr] = (history[dateStr] || 0) + 1;
    }
  }

  const uniqueDays = Object.keys(history).sort();
  if (uniqueDays.length === 0) {
    return {
      currentStreak: 0,
      longestStreak: 0,
      activeToday: false,
      history: {},
    };
  }

  // Today and Yesterday in UTC
  const now = new Date();
  const todayStr = now.toISOString().split('T')[0];

  const yesterday = new Date(now.getTime() - 24 * 60 * 60 * 1000);
  const yesterdayStr = yesterday.toISOString().split('T')[0];

  const activeToday = Boolean(history[todayStr]);

  // Calculate current streak
  let currentStreak = 0;
  // If user attempted today, start checking backwards from today; if not, check from yesterday
  const anchorDateStr = activeToday ? todayStr : yesterdayStr;

  if (history[anchorDateStr]) {
    currentStreak = 1;
    let checkDate = new Date(anchorDateStr + 'T00:00:00.000Z');
    let hasPreviousDay = true;

    while (hasPreviousDay) {
      checkDate = new Date(checkDate.getTime() - 24 * 60 * 60 * 1000);
      const prevDateStr = checkDate.toISOString().split('T')[0];
      if (history[prevDateStr]) {
        currentStreak++;
      } else {
        hasPreviousDay = false;
      }
    }
  }

  // Calculate longest streak across entire history
  let longestStreak = 0;
  let currentRun = 0;
  let prevTimestamp: number | null = null;

  for (const dayStr of uniqueDays) {
    const currentTimestamp = new Date(dayStr + 'T00:00:00.000Z').getTime();

    if (prevTimestamp === null) {
      currentRun = 1;
    } else {
      const diffDays = Math.round(
        (currentTimestamp - prevTimestamp) / (24 * 60 * 60 * 1000)
      );
      if (diffDays === 1) {
        currentRun++;
      } else {
        currentRun = 1;
      }
    }

    if (currentRun > longestStreak) {
      longestStreak = currentRun;
    }
    prevTimestamp = currentTimestamp;
  }

  return {
    currentStreak,
    longestStreak,
    activeToday,
    history,
  };
}

/**
 * Aggregates complete dashboard analytics for a user.
 */
export async function getUserDashboardAnalytics(
  userId: Types.ObjectId | string
): Promise<DashboardAnalyticsResult> {
  const problems = await Problem.find({ user: userId });
  const attempts = await Attempt.find({ user: userId })
    .populate('problem', 'title topic difficulty')
    .sort({ attemptedAt: -1 });

  const totalProblems = problems.length;
  const totalSolved = problems.filter(
    (p) => p.status === 'Solved' || p.status === 'Mastered'
  ).length;
  const totalAttempted = problems.filter((p) => p.status === 'Attempted').length;
  const totalMastered = problems.filter((p) => p.status === 'Mastered').length;

  const byDifficulty = {
    Easy: {
      total: problems.filter((p) => p.difficulty === 'Easy').length,
      solved: problems.filter(
        (p) => p.difficulty === 'Easy' && (p.status === 'Solved' || p.status === 'Mastered')
      ).length,
    },
    Medium: {
      total: problems.filter((p) => p.difficulty === 'Medium').length,
      solved: problems.filter(
        (p) =>
          p.difficulty === 'Medium' && (p.status === 'Solved' || p.status === 'Mastered')
      ).length,
    },
    Hard: {
      total: problems.filter((p) => p.difficulty === 'Hard').length,
      solved: problems.filter(
        (p) => p.difficulty === 'Hard' && (p.status === 'Solved' || p.status === 'Mastered')
      ).length,
    },
  };

  const totalAttempts = attempts.length;
  const totalSolvedAttempts = attempts.filter((a) => a.result === 'Solved').length;
  const overallSuccessRate =
    totalAttempts > 0
      ? Math.round((totalSolvedAttempts / totalAttempts) * 100)
      : 0;

  const totalPracticeTimeMinutes = attempts.reduce(
    (acc, a) => acc + (a.timeTakenMinutes || 0),
    0
  );

  const streakData = calculateStreaks(attempts.map((a) => a.attemptedAt));

  // Count weak topics
  const topicStats = await getUserTopicAnalytics(userId);
  const weakTopicsCount = topicStats.filter((t) => t.isWeak).length;

  const recentActivity = attempts.slice(0, 5).map((a) => {
    const prob = a.problem as unknown as {
      title?: string;
      topic?: string;
      difficulty?: string;
    };
    return {
      _id: a._id.toString(),
      problemTitle: prob?.title || 'Unknown Problem',
      topic: prob?.topic || 'General',
      difficulty: prob?.difficulty || 'Medium',
      result: a.result,
      timeTakenMinutes: a.timeTakenMinutes,
      attemptedAt: a.attemptedAt,
    };
  });

  return {
    totalProblems,
    totalSolved,
    totalAttempted,
    totalMastered,
    byDifficulty,
    totalAttempts,
    totalSolvedAttempts,
    overallSuccessRate,
    totalPracticeTimeMinutes,
    currentStreak: streakData.currentStreak,
    longestStreak: streakData.longestStreak,
    activeToday: streakData.activeToday,
    weakTopicsCount,
    recentActivity,
  };
}

/**
 * Aggregates detailed Topic Mastery and Weak Topic diagnostics across all 16 canonical topics.
 */
export async function getUserTopicAnalytics(
  userId: Types.ObjectId | string
): Promise<TopicStatItem[]> {
  const problems = await Problem.find({ user: userId });
  const attempts = await Attempt.find({ user: userId }).populate('problem');

  return TOPICS.map((topic) => {
    const topicProblems = problems.filter((p) => p.topic === topic);
    const solvedProblems = topicProblems.filter(
      (p) => p.status === 'Solved' || p.status === 'Mastered'
    );

    const easySolved = solvedProblems.filter((p) => p.difficulty === 'Easy').length;
    const mediumSolved = solvedProblems.filter((p) => p.difficulty === 'Medium').length;
    const hardSolved = solvedProblems.filter((p) => p.difficulty === 'Hard').length;

    // Filter attempts for problems belonging to this topic
    const topicAttempts = attempts.filter((a) => {
      const prob = a.problem as unknown as { topic?: string };
      return prob && prob.topic === topic;
    });

    const totalAttempts = topicAttempts.length;
    const successfulAttempts = topicAttempts.filter((a) => a.result === 'Solved').length;

    const mastery = calculateTopicMastery({
      solvedCount: solvedProblems.length,
      totalAttempts,
      successfulAttempts,
      easySolved,
      mediumSolved,
      hardSolved,
    });

    const weak = identifyWeakTopic(
      totalAttempts,
      mastery.masteryScore,
      mastery.successRate
    );

    return {
      topic,
      totalProblems: topicProblems.length,
      solvedCount: solvedProblems.length,
      attemptCount: totalAttempts,
      successfulAttempts,
      successRate: mastery.successRate,
      masteryScore: mastery.masteryScore,
      volumeScore: mastery.volumeScore,
      difficultyWeight: mastery.difficultyWeight,
      isWeak: weak.isWeak,
      weakReasons: weak.reasons,
    };
  });
}

export const analyticsService = {
  calculateTopicMastery,
  identifyWeakTopic,
  calculateStreaks,
  getUserDashboardAnalytics,
  getUserTopicAnalytics,
};

export default analyticsService;
