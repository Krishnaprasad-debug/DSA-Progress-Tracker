import { Request, Response, NextFunction } from 'express';
import { ATTEMPT_RESULTS, AttemptResult } from '../models/Attempt';

export const validateCreateAttempt = (
  req: Request,
  res: Response,
  next: NextFunction
): void => {
  const { result, timeTakenMinutes, notes } = req.body;
  const errors: string[] = [];

  if (!result || typeof result !== 'string') {
    errors.push('Attempt result is required');
  } else if (!ATTEMPT_RESULTS.includes(result as AttemptResult)) {
    errors.push(`Result must be one of: ${ATTEMPT_RESULTS.join(', ')}`);
  }

  if (timeTakenMinutes === undefined || timeTakenMinutes === null) {
    errors.push('Time taken in minutes is required');
  } else if (typeof timeTakenMinutes !== 'number' || isNaN(timeTakenMinutes)) {
    errors.push('Time taken must be a valid number');
  } else if (timeTakenMinutes < 1) {
    errors.push('Time taken must be at least 1 minute');
  }

  if (notes !== undefined && notes !== null) {
    if (typeof notes !== 'string') {
      errors.push('Notes must be a string');
    } else if (notes.length > 2000) {
      errors.push('Notes cannot exceed 2000 characters');
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
