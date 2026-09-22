import { Types } from 'mongoose';
import { Goal, IGoal, GoalType, GoalStatus } from '../models/Goal';
import { Problem } from '../models/Problem';
import { Attempt } from '../models/Attempt';
import { analyticsService } from './analyticsService';
import { Topic } from '../models/Problem';

export interface CreateGoalInput {
  title: string;
  description?: string;
  type: GoalType;
  targetValue: number;
  topic?: Topic;
  deadline?: Date | null;
}

export interface UpdateGoalInput {
  title?: string;
  description?: string;
  targetValue?: number;
  topic?: Topic;
  deadline?: Date | null;
  status?: GoalStatus;
  currentValue?: number;
}

export interface GoalProgress {
  currentValue: number;
  progressPercentage: number;
  isCompleted: boolean;
}

export const getWeekBounds = (
  referenceDate: Date = new Date()
): { startOfWeek: Date; endOfWeek: Date } => {
  const d = new Date(referenceDate);
  const day = d.getUTCDay();
  const diffToMonday = day === 0 ? -6 : 1 - day;

  const startOfWeek = new Date(
    Date.UTC(
      d.getUTCFullYear(),
      d.getUTCMonth(),
      d.getUTCDate() + diffToMonday,
      0,
      0,
      0,
      0
    )
  );
  const endOfWeek = new Date(
    Date.UTC(
      startOfWeek.getUTCFullYear(),
      startOfWeek.getUTCMonth(),
      startOfWeek.getUTCDate() + 6,
      23,
      59,
      59,
      999
    )
  );

  return { startOfWeek, endOfWeek };
};

export const calculateProgress = (
  current: number,
  target: number
): { progressPercentage: number; isCompleted: boolean } => {
  if (target <= 0) {
    return { progressPercentage: 0, isCompleted: false };
  }
  const percentage = Math.min(100, Math.max(0, Math.round((current / target) * 100)));
  return {
    progressPercentage: percentage,
    isCompleted: current >= target,
  };
};

class GoalService {
  /**
   * Helper to aggregate user weekly stats and topic mastery scores
   */
  private async getUserProgressContext(userId: string) {
    const userObjId = new Types.ObjectId(userId);
    const { startOfWeek, endOfWeek } = getWeekBounds();

    // 1. Weekly attempts
    const weeklyAttempts = await Attempt.find({
      user: userObjId,
      attemptedAt: { $gte: startOfWeek, $lte: endOfWeek },
    }).lean();

    const weeklyMinutes = weeklyAttempts.reduce(
      (sum, att) => sum + (att.timeTakenMinutes || 0),
      0
    );

    // Unique problems solved this week (either via solved attempt or updated solved status this week)
    const solvedProblemIds = new Set<string>();
    for (const att of weeklyAttempts) {
      if (att.result === 'Solved') {
        solvedProblemIds.add(att.problem.toString());
      }
    }

    const weeklyProblemsSolved = await Problem.countDocuments({
      user: userObjId,
      status: { $in: ['Solved', 'Mastered'] },
      $or: [
        { _id: { $in: Array.from(solvedProblemIds).map((id) => new Types.ObjectId(id)) } },
        {
          lastPracticedAt: { $gte: startOfWeek, $lte: endOfWeek },
        },
      ],
    });

    // 2. Topic mastery map
    const topicAnalytics = await analyticsService.getUserTopicAnalytics(userId);
    const topicMasteryMap = new Map<string, number>();
    for (const t of topicAnalytics) {
      topicMasteryMap.set(t.topic, t.masteryScore);
    }

    // 3. Overall solved count
    const totalSolved = await Problem.countDocuments({
      user: userObjId,
      status: { $in: ['Solved', 'Mastered'] },
    });

    return {
      weeklyProblemsSolved,
      weeklyMinutes,
      topicMasteryMap,
      totalSolved,
    };
  }

  /**
   * Evaluate a goal's current progress dynamically
   */
  public evaluateGoal(
    goal: IGoal,
    context: {
      weeklyProblemsSolved: number;
      weeklyMinutes: number;
      topicMasteryMap: Map<string, number>;
      totalSolved: number;
    }
  ): IGoal {
    let current = 0;

    switch (goal.type) {
      case 'weekly_problems':
        current = context.weeklyProblemsSolved;
        break;
      case 'practice_time':
        current = context.weeklyMinutes;
        break;
      case 'topic_mastery':
        current = context.topicMasteryMap.get(goal.topic || '') || 0;
        break;
      case 'custom':
        current = goal.currentValue || 0;
        break;
      default:
        current = 0;
    }

    const { progressPercentage, isCompleted } = calculateProgress(
      current,
      goal.targetValue
    );

    goal.currentValue = current;
    goal.progressPercentage = progressPercentage;

    if (isCompleted && goal.status === 'active') {
      goal.status = 'completed';
    }

    return goal;
  }

  /**
   * Create a new personal goal
   */
  public async createGoal(userId: string, input: CreateGoalInput): Promise<IGoal> {
    const goal = new Goal({
      user: new Types.ObjectId(userId),
      title: input.title.trim(),
      description: input.description?.trim() || '',
      type: input.type,
      targetValue: input.targetValue,
      topic: input.topic,
      deadline: input.deadline ? new Date(input.deadline) : null,
      status: 'active',
    });

    await goal.save();

    // Evaluate progress immediately
    const context = await this.getUserProgressContext(userId);
    const evaluated = this.evaluateGoal(goal, context);
    await evaluated.save();

    return evaluated;
  }

  /**
   * Get all goals for user, dynamically evaluated
   */
  public async getUserGoals(
    userId: string,
    statusFilter?: GoalStatus
  ): Promise<IGoal[]> {
    const query: { user: Types.ObjectId; status?: GoalStatus } = {
      user: new Types.ObjectId(userId),
    };

    if (statusFilter) {
      query.status = statusFilter;
    }

    const goals = await Goal.find(query).sort({ createdAt: -1 });
    const context = await this.getUserProgressContext(userId);

    const evaluatedGoals: IGoal[] = [];
    for (const goal of goals) {
      const evaluated = this.evaluateGoal(goal, context);
      await evaluated.save();
      evaluatedGoals.push(evaluated);
    }

    return evaluatedGoals;
  }

  /**
   * Get single goal by ID
   */
  public async getGoalById(userId: string, goalId: string): Promise<IGoal | null> {
    if (!Types.ObjectId.isValid(goalId)) {
      return null;
    }

    const goal = await Goal.findOne({
      _id: new Types.ObjectId(goalId),
      user: new Types.ObjectId(userId),
    });

    if (!goal) {
      return null;
    }

    const context = await this.getUserProgressContext(userId);
    const evaluated = this.evaluateGoal(goal, context);
    await evaluated.save();

    return evaluated;
  }

  /**
   * Update a goal
   */
  public async updateGoal(
    userId: string,
    goalId: string,
    input: UpdateGoalInput
  ): Promise<IGoal | null> {
    if (!Types.ObjectId.isValid(goalId)) {
      return null;
    }

    const goal = await Goal.findOne({
      _id: new Types.ObjectId(goalId),
      user: new Types.ObjectId(userId),
    });

    if (!goal) {
      return null;
    }

    if (input.title !== undefined) goal.title = input.title.trim();
    if (input.description !== undefined) goal.description = input.description.trim();
    if (input.targetValue !== undefined) goal.targetValue = input.targetValue;
    if (input.topic !== undefined) goal.topic = input.topic;
    if (input.deadline !== undefined) {
      goal.deadline = input.deadline ? new Date(input.deadline) : null;
    }
    if (input.status !== undefined) goal.status = input.status;
    if (input.currentValue !== undefined && goal.type === 'custom') {
      goal.currentValue = input.currentValue;
    }

    await goal.save();

    const context = await this.getUserProgressContext(userId);
    const evaluated = this.evaluateGoal(goal, context);
    await evaluated.save();

    return evaluated;
  }

  /**
   * Delete a goal
   */
  public async deleteGoal(userId: string, goalId: string): Promise<boolean> {
    if (!Types.ObjectId.isValid(goalId)) {
      return false;
    }

    const result = await Goal.deleteOne({
      _id: new Types.ObjectId(goalId),
      user: new Types.ObjectId(userId),
    });

    return result.deletedCount > 0;
  }
}

export const goalService = new GoalService();
export default goalService;
