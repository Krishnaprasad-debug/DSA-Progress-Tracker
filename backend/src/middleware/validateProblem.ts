import { Request, Response, NextFunction } from 'express';
import { TOPICS, DIFFICULTIES, PLATFORMS, STATUSES } from '../models/Problem';

export const validateCreateProblem = (req: Request, res: Response, next: NextFunction): void => {
  const { title, topic, difficulty, platform, status, estimatedTimeMinutes } = req.body;
  const errors: string[] = [];

  if (!title || typeof title !== 'string' || title.trim().length < 2) {
    errors.push('Title must be at least 2 characters long');
  } else if (title.trim().length > 120) {
    errors.push('Title cannot exceed 120 characters');
  }

  if (!topic || !TOPICS.includes(topic)) {
    errors.push(`Topic must be one of: ${TOPICS.join(', ')}`);
  }

  if (!difficulty || !DIFFICULTIES.includes(difficulty)) {
    errors.push(`Difficulty must be one of: ${DIFFICULTIES.join(', ')}`);
  }

  if (platform && !PLATFORMS.includes(platform)) {
    errors.push(`Platform must be one of: ${PLATFORMS.join(', ')}`);
  }

  if (status && !STATUSES.includes(status)) {
    errors.push(`Status must be one of: ${STATUSES.join(', ')}`);
  }

  if (
    estimatedTimeMinutes !== undefined &&
    (typeof estimatedTimeMinutes !== 'number' || estimatedTimeMinutes < 1 || estimatedTimeMinutes > 600)
  ) {
    errors.push('Estimated time must be a number between 1 and 600 minutes');
  }

  if (errors.length > 0) {
    res.status(400).json({ error: 'Validation Failed', details: errors });
    return;
  }

  next();
};

export const validateUpdateProblem = (req: Request, res: Response, next: NextFunction): void => {
  const { title, topic, difficulty, platform, status, estimatedTimeMinutes } = req.body;
  const errors: string[] = [];

  if (title !== undefined) {
    if (typeof title !== 'string' || title.trim().length < 2) {
      errors.push('Title must be at least 2 characters long');
    } else if (title.trim().length > 120) {
      errors.push('Title cannot exceed 120 characters');
    }
  }

  if (topic !== undefined && !TOPICS.includes(topic)) {
    errors.push(`Topic must be one of: ${TOPICS.join(', ')}`);
  }

  if (difficulty !== undefined && !DIFFICULTIES.includes(difficulty)) {
    errors.push(`Difficulty must be one of: ${DIFFICULTIES.join(', ')}`);
  }

  if (platform !== undefined && !PLATFORMS.includes(platform)) {
    errors.push(`Platform must be one of: ${PLATFORMS.join(', ')}`);
  }

  if (status !== undefined && !STATUSES.includes(status)) {
    errors.push(`Status must be one of: ${STATUSES.join(', ')}`);
  }

  if (
    estimatedTimeMinutes !== undefined &&
    (typeof estimatedTimeMinutes !== 'number' || estimatedTimeMinutes < 1 || estimatedTimeMinutes > 600)
  ) {
    errors.push('Estimated time must be a number between 1 and 600 minutes');
  }

  if (errors.length > 0) {
    res.status(400).json({ error: 'Validation Failed', details: errors });
    return;
  }

  next();
};
