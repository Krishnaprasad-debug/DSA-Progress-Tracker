import { Request, Response, NextFunction } from 'express';
import { Types } from 'mongoose';
import { REVISION_INTERVALS, RevisionInterval } from '../models/Revision';

export const validateCreateRevision = (
  req: Request,
  res: Response,
  next: NextFunction
): void => {
  const { problemId, intervalDays, scheduledDate } = req.body;
  const errors: string[] = [];

  if (!problemId || typeof problemId !== 'string') {
    errors.push('Problem ID is required');
  } else if (!Types.ObjectId.isValid(problemId)) {
    errors.push('Invalid problem ID format');
  }

  if (intervalDays !== undefined && intervalDays !== null) {
    if (!REVISION_INTERVALS.includes(intervalDays as RevisionInterval)) {
      errors.push(
        `Interval days must be one of: ${REVISION_INTERVALS.join(', ')}`
      );
    }
  }

  if (scheduledDate !== undefined && scheduledDate !== null) {
    const parsed = new Date(scheduledDate);
    if (isNaN(parsed.getTime())) {
      errors.push('Scheduled date must be a valid date');
    }
  }

  if (errors.length > 0) {
    res.status(400).json({
      error: 'Validation Error',
      details: errors,
    });
    return;
  }

  next();
};
