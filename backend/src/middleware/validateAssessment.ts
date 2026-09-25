import { Request, Response, NextFunction } from 'express';
import { Types } from 'mongoose';

export const validateCreateAssessment = (
  req: Request,
  res: Response,
  next: NextFunction
): void => {
  const { title, description, durationMinutes, problemIds } = req.body;
  const errors: string[] = [];

  if (!title || typeof title !== 'string' || title.trim().length === 0) {
    errors.push('Assessment title is required');
  } else if (title.trim().length > 100) {
    errors.push('Assessment title cannot exceed 100 characters');
  }

  if (description !== undefined && description !== null) {
    if (typeof description !== 'string') {
      errors.push('Description must be a string');
    } else if (description.trim().length > 300) {
      errors.push('Description cannot exceed 300 characters');
    }
  }

  if (durationMinutes !== undefined && durationMinutes !== null) {
    if (
      typeof durationMinutes !== 'number' ||
      !Number.isFinite(durationMinutes) ||
      durationMinutes < 10 ||
      durationMinutes > 240
    ) {
      errors.push('Duration must be between 10 and 240 minutes');
    }
  }

  if (!problemIds || !Array.isArray(problemIds) || problemIds.length === 0) {
    errors.push('At least one problem ID is required');
  } else if (problemIds.length > 10) {
    errors.push('An assessment cannot exceed 10 problems');
  } else {
    for (const id of problemIds) {
      if (typeof id !== 'string' || !Types.ObjectId.isValid(id)) {
        errors.push(`Invalid problem ID format: ${id}`);
        break;
      }
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

export const validateSubmitAttempt = (
  req: Request,
  res: Response,
  next: NextFunction
): void => {
  const { problemId, result, timeTakenMinutes, notes } = req.body;
  const errors: string[] = [];

  if (!problemId || typeof problemId !== 'string' || !Types.ObjectId.isValid(problemId)) {
    errors.push('Valid problem ID is required');
  }

  if (!result || typeof result !== 'string' || !['Solved', 'Failed'].includes(result)) {
    errors.push('Result must be either "Solved" or "Failed"');
  }

  if (
    timeTakenMinutes === undefined ||
    typeof timeTakenMinutes !== 'number' ||
    !Number.isFinite(timeTakenMinutes) ||
    timeTakenMinutes < 1
  ) {
    errors.push('Time taken must be a positive number of minutes (at least 1)');
  }

  if (notes !== undefined && notes !== null) {
    if (typeof notes !== 'string') {
      errors.push('Notes must be a string');
    } else if (notes.trim().length > 500) {
      errors.push('Notes cannot exceed 500 characters');
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
