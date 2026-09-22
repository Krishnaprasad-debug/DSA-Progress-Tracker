import { Types } from 'mongoose';
import { Problem } from '../models/Problem';
import { Attempt } from '../models/Attempt';
import { getWeekBounds, goalService } from './goalService';
import { analyticsService } from './analyticsService';
import { IGoal } from '../models/Goal';

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

export interface WeeklyReportData {
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
  activeGoals: IGoal[];
}

const DAY_NAMES = [
  'Sunday',
  'Monday',
  'Tuesday',
  'Wednesday',
  'Thursday',
  'Friday',
  'Saturday',
];

export const calculateVelocityTrend = (
  deltaSolved: number,
  deltaTime: number
): 'accelerating' | 'steady' | 'declining' => {
  if (deltaSolved > 0 || (deltaSolved === 0 && deltaTime > 0)) {
    return 'accelerating';
  }
  if (deltaSolved < 0 && deltaTime < 0) {
    return 'declining';
  }
  return 'steady';
};

class ReportService {
  public async getWeeklyReport(userId: string): Promise<WeeklyReportData> {
    const userObjId = new Types.ObjectId(userId);
    const { startOfWeek, endOfWeek } = getWeekBounds();

    // Previous week bounds
    const prevStartOfWeek = new Date(startOfWeek.getTime() - 7 * 24 * 60 * 60 * 1000);
    const prevEndOfWeek = new Date(endOfWeek.getTime() - 7 * 24 * 60 * 60 * 1000);

    // 1. Current Week Attempts
    const currentAttempts = await Attempt.find({
      user: userObjId,
      attemptedAt: { $gte: startOfWeek, $lte: endOfWeek },
    }).lean();

    // 2. Previous Week Attempts
    const prevAttempts = await Attempt.find({
      user: userObjId,
      attemptedAt: { $gte: prevStartOfWeek, $lte: prevEndOfWeek },
    }).lean();

    // Current week metrics
    const totalAttempts = currentAttempts.length;
    const solvedAttempts = currentAttempts.filter((a) => a.result === 'Solved').length;
    const successRate =
      totalAttempts > 0 ? Math.round((solvedAttempts / totalAttempts) * 100) : 0;
    const practiceTimeMinutes = currentAttempts.reduce(
      (sum, a) => sum + (a.timeTakenMinutes || 0),
      0
    );

    // Current week unique solved problems
    const solvedProblemIds = new Set<string>();
    for (const att of currentAttempts) {
      if (att.result === 'Solved') {
        solvedProblemIds.add(att.problem.toString());
      }
    }
    const problemsSolved = await Problem.countDocuments({
      user: userObjId,
      status: { $in: ['Solved', 'Mastered'] },
      $or: [
        { _id: { $in: Array.from(solvedProblemIds).map((id) => new Types.ObjectId(id)) } },
        { lastPracticedAt: { $gte: startOfWeek, $lte: endOfWeek } },
      ],
    });

    // Previous week metrics
    const prevTotalAttempts = prevAttempts.length;
    const prevSolvedAttempts = prevAttempts.filter((a) => a.result === 'Solved').length;
    const prevSuccessRate =
      prevTotalAttempts > 0
        ? Math.round((prevSolvedAttempts / prevTotalAttempts) * 100)
        : 0;
    const prevPracticeTimeMinutes = prevAttempts.reduce(
      (sum, a) => sum + (a.timeTakenMinutes || 0),
      0
    );

    const prevSolvedProblemIds = new Set<string>();
    for (const att of prevAttempts) {
      if (att.result === 'Solved') {
        prevSolvedProblemIds.add(att.problem.toString());
      }
    }
    const prevProblemsSolved = await Problem.countDocuments({
      user: userObjId,
      status: { $in: ['Solved', 'Mastered'] },
      $or: [
        { _id: { $in: Array.from(prevSolvedProblemIds).map((id) => new Types.ObjectId(id)) } },
        { lastPracticedAt: { $gte: prevStartOfWeek, $lte: prevEndOfWeek } },
      ],
    });

    // Deltas & Velocity
    const deltaProblemsSolved = problemsSolved - prevProblemsSolved;
    const deltaPracticeTimeMinutes = practiceTimeMinutes - prevPracticeTimeMinutes;
    const deltaSuccessRate = successRate - prevSuccessRate;
    const velocityTrend = calculateVelocityTrend(
      deltaProblemsSolved,
      deltaPracticeTimeMinutes
    );

    // 3. 7-Day Day-by-Day Breakdown (Monday to Sunday)
    const dailyBreakdown: DayActivity[] = [];
    const activeDates = new Set<string>();

    for (let i = 0; i < 7; i++) {
      const dayDate = new Date(startOfWeek.getTime() + i * 24 * 60 * 60 * 1000);
      const dateStr = dayDate.toISOString().split('T')[0];
      const dayName = DAY_NAMES[dayDate.getUTCDay()];

      // Attempts on this calendar day
      const dayAttempts = currentAttempts.filter((att) => {
        const attDate = new Date(att.attemptedAt).toISOString().split('T')[0];
        return attDate === dateStr;
      });

      if (dayAttempts.length > 0) {
        activeDates.add(dateStr);
      }

      const daySolved = dayAttempts.filter((a) => a.result === 'Solved').length;
      const dayMinutes = dayAttempts.reduce(
        (sum, a) => sum + (a.timeTakenMinutes || 0),
        0
      );

      dailyBreakdown.push({
        date: dateStr,
        dayName,
        solvedCount: daySolved,
        attemptCount: dayAttempts.length,
        practiceTimeMinutes: dayMinutes,
      });
    }

    const activeDaysCount = activeDates.size;

    // 4. Neglected Weak Topics (weak topics from analytics with 0 attempts this week)
    const topicAnalytics = await analyticsService.getUserTopicAnalytics(userId);
    const weakTopics = topicAnalytics.filter((t) => t.isWeak);
    const neglectedWeakTopics: NeglectedWeakTopic[] = [];

    // Topic attempts count this week
    const topicAttemptCounts = new Map<string, number>();
    for (const att of currentAttempts) {
      // Find problem topic
      const prob = await Problem.findById(att.problem).select('topic').lean();
      if (prob && prob.topic) {
        const count = topicAttemptCounts.get(prob.topic) || 0;
        topicAttemptCounts.set(prob.topic, count + 1);
      }
    }

    for (const wt of weakTopics) {
      const attemptsThisWeek = topicAttemptCounts.get(wt.topic) || 0;
      if (attemptsThisWeek === 0) {
        neglectedWeakTopics.push({
          topic: wt.topic,
          masteryScore: wt.masteryScore,
          successRate: wt.successRate,
          attemptsThisWeek: 0,
          recommendation: `High Priority: You have not practiced ${wt.topic} this week. Dedicate your next session to foundational Easy problems.`,
        });
      }
    }

    // 5. Active Goals
    const activeGoals = await goalService.getUserGoals(userId, 'active');

    return {
      weekRange: {
        start: startOfWeek.toISOString().split('T')[0],
        end: endOfWeek.toISOString().split('T')[0],
      },
      summary: {
        problemsSolved,
        totalAttempts,
        solvedAttempts,
        successRate,
        practiceTimeMinutes,
        activeDaysCount,
      },
      previousWeekComparison: {
        prevProblemsSolved,
        prevPracticeTimeMinutes,
        prevSuccessRate,
        deltaProblemsSolved,
        deltaPracticeTimeMinutes,
        deltaSuccessRate,
        velocityTrend,
      },
      dailyBreakdown,
      neglectedWeakTopics,
      activeGoals,
    };
  }
}

export const reportService = new ReportService();
export default reportService;
