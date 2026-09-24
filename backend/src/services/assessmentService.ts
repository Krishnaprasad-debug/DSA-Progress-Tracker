import { Types } from 'mongoose';
import {
  Assessment,
  IAssessment,
  IAssessmentProblem,
  AssessmentStatus,
  AssessmentVerdict,
} from '../models/Assessment';
import { Problem } from '../models/Problem';
import { Attempt } from '../models/Attempt';

export interface CreateAssessmentInput {
  title: string;
  description?: string;
  durationMinutes?: number;
  problemIds: string[];
}

export interface SubmitAssessmentAttemptInput {
  problemId: string;
  result: 'Solved' | 'Failed';
  timeTakenMinutes: number;
  notes?: string;
}

export interface ScoringResult {
  score: number;
  maxScore: number;
  percentage: number;
  timeBonus: number;
  verdict: AssessmentVerdict;
}

export const getPointWeight = (difficulty: string): number => {
  switch (difficulty) {
    case 'Easy':
      return 20;
    case 'Medium':
      return 40;
    case 'Hard':
      return 60;
    default:
      return 40;
  }
};

export const calculateScoring = (
  problems: IAssessmentProblem[],
  durationMinutes: number,
  timeSpentMinutes: number
): ScoringResult => {
  const maxScore = problems.reduce((acc, p) => acc + p.pointWeight, 0);

  let earnedBase = 0;
  let allSolved = problems.length > 0;

  for (const p of problems) {
    if (p.status === 'solved') {
      const penalties = Math.max(0, (p.attempts - 1) * 5);
      // Floor constraint: problem score cannot fall below 50% of its base weight
      const minProblemPoints = Math.round(p.pointWeight * 0.5);
      const earned = Math.max(minProblemPoints, p.pointWeight - penalties);
      earnedBase += earned;
    } else {
      allSolved = false;
    }
  }

  // Time Bonus: up to 15 bonus points if all problems solved early
  let timeBonus = 0;
  if (allSolved && durationMinutes > 0 && timeSpentMinutes < durationMinutes) {
    const fraction = (durationMinutes - timeSpentMinutes) / durationMinutes;
    timeBonus = Math.min(15, Math.round(fraction * 15));
  }

  const finalScore = Math.min(maxScore, earnedBase + timeBonus);
  const percentage = maxScore > 0 ? Math.round((finalScore / maxScore) * 100) : 0;

  let verdict: AssessmentVerdict = 'needs_practice';
  if (percentage >= 85) {
    verdict = 'strong_hire';
  } else if (percentage >= 70) {
    verdict = 'hire';
  } else if (percentage >= 50) {
    verdict = 'leaning_hire';
  }

  return {
    score: finalScore,
    maxScore,
    percentage,
    timeBonus,
    verdict,
  };
};

class AssessmentService {
  /**
   * Create & configure a new mock interview assessment
   */
  public async createAssessment(
    userId: string,
    input: CreateAssessmentInput
  ): Promise<IAssessment> {
    const userObjId = new Types.ObjectId(userId);

    // Fetch the requested problems
    const problemObjIds = input.problemIds.map((id) => new Types.ObjectId(id));
    const problems = await Problem.find({
      _id: { $in: problemObjIds },
      user: userObjId,
    });

    if (problems.length === 0) {
      throw new Error('No valid problems found for assessment');
    }

    const assessmentProblems: IAssessmentProblem[] = problems.map((prob) => ({
      problem: prob._id as Types.ObjectId,
      pointWeight: getPointWeight(prob.difficulty),
      status: 'unsolved',
      attempts: 0,
      timeTakenMinutes: 0,
      solvedAt: null,
      notes: '',
    }));

    const maxScore = assessmentProblems.reduce(
      (sum, p) => sum + p.pointWeight,
      0
    );

    const assessment = new Assessment({
      user: userObjId,
      title: input.title.trim(),
      description: input.description?.trim() || '',
      durationMinutes: input.durationMinutes || 60,
      status: 'configured',
      problems: assessmentProblems,
      score: 0,
      maxScore,
      timeSpentMinutes: 0,
      verdict: 'pending',
    });

    await assessment.save();
    return assessment;
  }

  /**
   * Start a configured assessment and begin timer
   */
  public async startAssessment(
    userId: string,
    assessmentId: string
  ): Promise<IAssessment | null> {
    if (!Types.ObjectId.isValid(assessmentId)) return null;

    const assessment = await Assessment.findOne({
      _id: new Types.ObjectId(assessmentId),
      user: new Types.ObjectId(userId),
    });

    if (!assessment) return null;

    if (assessment.status === 'completed' || assessment.status === 'expired') {
      return assessment;
    }

    if (assessment.status === 'configured') {
      assessment.status = 'in_progress';
      assessment.startTime = new Date();
      await assessment.save();
    }

    return assessment;
  }

  /**
   * Submit an attempt on a problem during an active assessment
   */
  public async submitProblemAttempt(
    userId: string,
    assessmentId: string,
    input: SubmitAssessmentAttemptInput
  ): Promise<IAssessment | null> {
    if (!Types.ObjectId.isValid(assessmentId)) return null;

    const assessment = await Assessment.findOne({
      _id: new Types.ObjectId(assessmentId),
      user: new Types.ObjectId(userId),
    });

    if (!assessment) return null;

    // Check expiration if in progress
    if (assessment.status === 'in_progress' && assessment.startTime) {
      const elapsedMs = Date.now() - new Date(assessment.startTime).getTime();
      const maxMs = assessment.durationMinutes * 60 * 1000;
      if (elapsedMs > maxMs) {
        assessment.status = 'expired';
        await assessment.save();
        return assessment;
      }
    }

    const probSub = assessment.problems.find(
      (p) => p.problem.toString() === input.problemId
    );

    if (!probSub) {
      throw new Error('Problem is not part of this assessment');
    }

    probSub.attempts += 1;
    probSub.timeTakenMinutes += input.timeTakenMinutes;
    if (input.notes) {
      probSub.notes = input.notes.trim();
    }

    if (input.result === 'Solved') {
      probSub.status = 'solved';
      probSub.solvedAt = new Date();

      // Update problem status in main library
      await Problem.findByIdAndUpdate(input.problemId, {
        status: 'Solved',
        lastPracticedAt: new Date(),
      });
    } else if (probSub.status !== 'solved') {
      probSub.status = 'failed';
    }

    const previousAttemptsCount = await Attempt.countDocuments({
      problem: new Types.ObjectId(input.problemId),
      user: new Types.ObjectId(userId),
    });

    // Also record Attempt in master log for streak & stats
    await Attempt.create({
      problem: new Types.ObjectId(input.problemId),
      user: new Types.ObjectId(userId),
      attemptNumber: previousAttemptsCount + 1,
      result: input.result,
      timeTakenMinutes: input.timeTakenMinutes,
      notes: `[Mock Interview: ${assessment.title}] ${input.notes || ''}`.trim(),
      attemptedAt: new Date(),
    });

    await assessment.save();
    return assessment;
  }

  /**
   * Finish assessment session, compute scorecard and interview verdict
   */
  public async finishAssessment(
    userId: string,
    assessmentId: string
  ): Promise<IAssessment | null> {
    if (!Types.ObjectId.isValid(assessmentId)) return null;

    const assessment = await Assessment.findOne({
      _id: new Types.ObjectId(assessmentId),
      user: new Types.ObjectId(userId),
    });

    if (!assessment) return null;

    const now = new Date();
    assessment.endTime = now;

    let timeSpentMinutes = 0;
    if (assessment.startTime) {
      const elapsedMs = now.getTime() - new Date(assessment.startTime).getTime();
      timeSpentMinutes = Math.min(
        assessment.durationMinutes,
        Math.max(1, Math.round(elapsedMs / (60 * 1000)))
      );
    } else {
      timeSpentMinutes = assessment.problems.reduce(
        (sum, p) => sum + (p.timeTakenMinutes || 0),
        0
      );
    }

    assessment.timeSpentMinutes = timeSpentMinutes;

    const scoring = calculateScoring(
      assessment.problems,
      assessment.durationMinutes,
      timeSpentMinutes
    );

    assessment.score = scoring.score;
    assessment.maxScore = scoring.maxScore;
    assessment.verdict = scoring.verdict;
    assessment.status = 'completed';

    await assessment.save();
    return assessment;
  }

  /**
   * Get all assessments for user
   */
  public async getUserAssessments(
    userId: string,
    statusFilter?: AssessmentStatus
  ): Promise<IAssessment[]> {
    const query: { user: Types.ObjectId; status?: AssessmentStatus } = {
      user: new Types.ObjectId(userId),
    };
    if (statusFilter) {
      query.status = statusFilter;
    }

    return Assessment.find(query)
      .populate('problems.problem', 'title topic difficulty platform problemUrl')
      .sort({ createdAt: -1 });
  }

  /**
   * Get single assessment by ID with live remaining seconds
   */
  public async getAssessmentById(
    userId: string,
    assessmentId: string
  ): Promise<{ assessment: IAssessment; remainingSeconds: number } | null> {
    if (!Types.ObjectId.isValid(assessmentId)) return null;

    const assessment = await Assessment.findOne({
      _id: new Types.ObjectId(assessmentId),
      user: new Types.ObjectId(userId),
    }).populate('problems.problem', 'title topic difficulty platform problemUrl');

    if (!assessment) return null;

    let remainingSeconds = 0;
    if (assessment.status === 'in_progress' && assessment.startTime) {
      const elapsedSec = Math.floor(
        (Date.now() - new Date(assessment.startTime).getTime()) / 1000
      );
      const totalSec = assessment.durationMinutes * 60;
      remainingSeconds = Math.max(0, totalSec - elapsedSec);

      if (remainingSeconds === 0) {
        assessment.status = 'expired';
        await assessment.save();
      }
    } else if (assessment.status === 'configured') {
      remainingSeconds = assessment.durationMinutes * 60;
    }

    return { assessment, remainingSeconds };
  }

  /**
   * Delete an assessment
   */
  public async deleteAssessment(
    userId: string,
    assessmentId: string
  ): Promise<boolean> {
    if (!Types.ObjectId.isValid(assessmentId)) return false;

    const res = await Assessment.deleteOne({
      _id: new Types.ObjectId(assessmentId),
      user: new Types.ObjectId(userId),
    });

    return res.deletedCount > 0;
  }
}

export const assessmentService = new AssessmentService();
export default assessmentService;
