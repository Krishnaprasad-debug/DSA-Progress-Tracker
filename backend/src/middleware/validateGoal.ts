import { Request, Response, NextFunction } from 'express';
import { GOAL_TYPES, GOAL_STATUSES, GoalType, GoalStatus } from '../models/Goal';
import { TOPICS, Topic } from '../models/Problem';

export const validateCreateGoal = (
  req: Request,
  res: Response,
  next: NextFunction
): void => {
  const { title, description, type, targetValue, topic, deadline } = req.body;
  const errors: string[] = [];

  if (!title || typeof title !== 'string' || title.trim().length === 0) {
    errors.push('Goal title is required');
  } else if (title.trim().length > 100) {
    errors.push('Goal title cannot exceed 100 characters');
  }

  if (description !== undefined && description !== null) {
    if (typeof description !== 'string') {
      errors.push('Description must be a string');
    } else if (description.trim().length > 300) {
      errors.push('Description cannot exceed 300 characters');
    }
  }

  if (!type || typeof type !== 'string') {
    errors.push('Goal type is required');
  } else if (!GOAL_TYPES.includes(type as GoalType)) {
    errors.push(`Goal type must be one of: ${GOAL_TYPES.join(', ')}`);
  }

  if (targetValue === undefined || targetValue === null) {
    errors.push('Target value is required');
  } else if (
    typeof targetValue !== 'number' ||
    !Number.isFinite(targetValue) ||
    targetValue < 1
  ) {
    errors.push('Target value must be a positive number of at least 1');
  }

  if (type === 'topic_mastery') {
    if (!topic || typeof topic !== 'string') {
      errors.push('Topic is required for topic_mastery goal type');
    } else if (!TOPICS.includes(topic as Topic)) {
      errors.push(`Topic must be one of: ${TOPICS.join(', ')}`);
    }
  } else if (topic !== undefined && topic !== null && topic !== '') {
    if (!TOPICS.includes(topic as Topic)) {
      errors.push(`Topic must be one of: ${TOPICS.join(', ')}`);
    }
  }

  if (deadline !== undefined && deadline !== null && deadline !== '') {
    const parsed = new Date(deadline);
    if (isNaN(parsed.getTime())) {
      errors.push('Deadline must be a valid date');
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

export const validateUpdateGoal = (
  req: Request,
  res: Response,
  next: NextFunction
): void => {
  const { title, description, targetValue, topic, deadline, status } = req.body;
  const errors: string[] = [];

  if (title !== undefined) {
    if (typeof title !== 'string' || title.trim().length === 0) {
      errors.push('Goal title cannot be empty');
    } else if (title.trim().length > 100) {
      errors.push('Goal title cannot exceed 100 characters');
    }
  }

  if (description !== undefined && description !== null) {
    if (typeof description !== 'string') {
      errors.push('Description must be a string');
    } else if (description.trim().length > 300) {
      errors.push('Description cannot exceed 300 characters');
    }
  }

  if (targetValue !== undefined) {
    if (
      typeof targetValue !== 'number' ||
      !Number.isFinite(targetValue) ||
      targetValue < 1
    ) {
      errors.push('Target value must be a positive number of at least 1');
    }
  }

  if (topic !== undefined && topic !== null && topic !== '') {
    if (!TOPICS.includes(topic as Topic)) {
      errors.push(`Topic must be one of: ${TOPICS.join(', ')}`);
    }
  }

  if (deadline !== undefined && deadline !== null && deadline !== '') {
    const parsed = new Date(deadline);
    if (isNaN(parsed.getTime())) {
      errors.push('Deadline must be a valid date');
    }
  }

  if (status !== undefined) {
    if (!GOAL_STATUSES.includes(status as GoalStatus)) {
      errors.push(`Status must be one of: ${GOAL_STATUSES.join(', ')}`);
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
