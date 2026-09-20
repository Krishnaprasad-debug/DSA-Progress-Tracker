import { Types } from 'mongoose';
import { Attempt } from '../models/Attempt';
import { Problem, Difficulty, ProblemStatus } from '../models/Problem';

export interface StruggleDetectionInput {
  status: ProblemStatus;
  difficulty: Difficulty;
}

export interface AttemptSummary {
  result: 'Solved' | 'Failed';
  timeTakenMinutes: number;
  attemptNumber?: number;
  attemptedAt?: Date;
}

export interface StruggleDetectionResult {
  isStruggle: boolean;
  reasons: string[];
}

/**
 * Pure deterministic struggle detection function.
 * Evaluates the 3 explicit conditions defined in the architectural specifications:
 * 1. Failed attempts >= 3.
 * 2. Latest attempt took > 1.5x user's average solving time for problems of that difficulty.
 * 3. Total attempts >= 4 and current status is NOT 'Mastered'.
 */
export function evaluateStruggleDetection(
  problem: StruggleDetectionInput,
  attempts: AttemptSummary[],
  userDifficultyAverageTime: number | null
): StruggleDetectionResult {
  const reasons: string[] = [];

  if (!attempts || attempts.length === 0) {
    return { isStruggle: false, reasons: [] };
  }

  // 1. Check failed attempts count >= 3
  const failedCount = attempts.filter((a) => a.result === 'Failed').length;
  if (failedCount >= 3) {
    reasons.push(`Problem has ${failedCount} failed attempts (threshold: 3).`);
  }

  // 2. Check if latest attempt took > 1.5x average solving time for this difficulty
  // Determine latest attempt: sort by attemptNumber or attemptedAt or use last item
  const sortedAttempts = [...attempts].sort((a, b) => {
    if (a.attemptNumber !== undefined && b.attemptNumber !== undefined) {
      return a.attemptNumber - b.attemptNumber;
    }
    const timeA = a.attemptedAt ? new Date(a.attemptedAt).getTime() : 0;
    const timeB = b.attemptedAt ? new Date(b.attemptedAt).getTime() : 0;
    return timeA - timeB;
  });

  const latestAttempt = sortedAttempts[sortedAttempts.length - 1];

  if (
    userDifficultyAverageTime !== null &&
    userDifficultyAverageTime > 0 &&
    latestAttempt
  ) {
    const threshold = 1.5 * userDifficultyAverageTime;
    if (latestAttempt.timeTakenMinutes > threshold) {
      reasons.push(
        `Latest attempt took ${latestAttempt.timeTakenMinutes} mins, exceeding 1.5x user average (${userDifficultyAverageTime.toFixed(
          1
        )} mins, threshold: ${threshold.toFixed(1)} mins) for ${problem.difficulty} problems.`
      );
    }
  }

  // 3. Check total attempts >= 4 and status is not Mastered
  if (attempts.length >= 4 && problem.status !== 'Mastered') {
    reasons.push(
      `Problem has ${attempts.length} attempts and has not reached Mastered status.`
    );
  }

  return {
    isStruggle: reasons.length > 0,
    reasons,
  };
}

/**
 * Calculates a user's average solving time (in minutes) for solved problems of a specific difficulty.
 * Returns null if no solved attempts exist for that difficulty.
 */
export async function getUserDifficultyAverageTime(
  userId: Types.ObjectId | string,
  difficulty: Difficulty
): Promise<number | null> {
  // Find all problems of this difficulty owned by the user
  const problems = await Problem.find({ user: userId, difficulty }).select('_id');
  if (!problems || problems.length === 0) {
    return null;
  }

  const problemIds = problems.map((p) => p._id);

  // Find all successful attempts for these problems
  const solvedAttempts = await Attempt.find({
    user: userId,
    problem: { $in: problemIds },
    result: 'Solved',
  }).select('timeTakenMinutes');

  if (!solvedAttempts || solvedAttempts.length === 0) {
    return null;
  }

  const totalMinutes = solvedAttempts.reduce(
    (sum, att) => sum + att.timeTakenMinutes,
    0
  );
  return totalMinutes / solvedAttempts.length;
}
