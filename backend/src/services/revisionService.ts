import { Types } from 'mongoose';
import { Revision, IRevision, RevisionInterval } from '../models/Revision';
import { Problem } from '../models/Problem';

export interface CompleteRevisionResult {
  completedRevision: IRevision;
  nextRevision: IRevision | null;
  mastered: boolean;
}

/**
 * Schedules an initial spaced revision for a problem (typically Day 1 after solving).
 * Ensures no duplicate uncompleted revision exists for this problem.
 */
export async function scheduleInitialRevision(
  problemId: Types.ObjectId | string,
  userId: Types.ObjectId | string,
  intervalDays: RevisionInterval = 1,
  baseDate: Date = new Date()
): Promise<IRevision> {
  // Check if an active uncompleted revision already exists for this problem
  const existingActive = await Revision.findOne({
    problem: problemId,
    user: userId,
    completed: false,
  });

  if (existingActive) {
    return existingActive;
  }

  const scheduledDate = new Date(
    baseDate.getTime() + intervalDays * 24 * 60 * 60 * 1000
  );

  const revision = new Revision({
    problem: problemId,
    user: userId,
    scheduledDate,
    intervalDays,
    completed: false,
    completedAt: null,
  });

  await revision.save();
  return revision;
}

/**
 * Completes a revision and implements the progressive 1d -> 7d -> 30d -> Mastered Leitner schedule.
 */
export async function completeRevisionAndScheduleNext(
  revisionId: Types.ObjectId | string,
  userId: Types.ObjectId | string
): Promise<CompleteRevisionResult | null> {
  const revision = await Revision.findOne({
    _id: revisionId,
    user: userId,
  });

  if (!revision) {
    return null;
  }

  if (revision.completed) {
    return {
      completedRevision: revision,
      nextRevision: null,
      mastered: false,
    };
  }

  // 1. Mark current revision completed
  revision.completed = true;
  revision.completedAt = new Date();
  await revision.save();

  let nextInterval: RevisionInterval | null = null;
  let mastered = false;

  // 2. Progressive Leitner Spaced Schedule
  if (revision.intervalDays === 1) {
    nextInterval = 7;
  } else if (revision.intervalDays === 7) {
    nextInterval = 30;
  } else if (revision.intervalDays === 30) {
    // 30-day revision completed -> promote Problem to 'Mastered'
    mastered = true;
    await Problem.findOneAndUpdate(
      { _id: revision.problem, user: userId },
      { status: 'Mastered', lastPracticedAt: new Date() }
    );
  }

  let nextRevision: IRevision | null = null;

  if (nextInterval) {
    const nextScheduledDate = new Date(
      Date.now() + nextInterval * 24 * 60 * 60 * 1000
    );

    nextRevision = new Revision({
      problem: revision.problem,
      user: userId,
      scheduledDate: nextScheduledDate,
      intervalDays: nextInterval,
      completed: false,
      completedAt: null,
    });

    await nextRevision.save();
  }

  return {
    completedRevision: revision,
    nextRevision,
    mastered,
  };
}
