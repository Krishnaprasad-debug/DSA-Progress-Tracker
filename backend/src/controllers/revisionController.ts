import { Request, Response } from 'express';
import { Types } from 'mongoose';
import { Revision } from '../models/Revision';
import { Problem } from '../models/Problem';
import {
  scheduleInitialRevision,
  completeRevisionAndScheduleNext,
} from '../services/revisionService';

export const getRevisionsDueToday = async (
  req: Request,
  res: Response
): Promise<void> => {
  try {
    if (!req.user) {
      res.status(401).json({ error: 'Not authorized' });
      return;
    }

    const userId = req.user._id;

    // End of today (23:59:59.999) to capture both today's and overdue revisions
    const endOfToday = new Date();
    endOfToday.setHours(23, 59, 59, 999);

    const revisions = await Revision.find({
      user: userId,
      completed: false,
      scheduledDate: { $lte: endOfToday },
    })
      .populate(
        'problem',
        'title topic difficulty platform problemUrl status estimatedTimeMinutes'
      )
      .sort({ scheduledDate: 1 });

    res.status(200).json({
      count: revisions.length,
      revisions,
    });
  } catch (error) {
    console.error('Error getting revisions due today:', error);
    res.status(500).json({ error: 'Internal Server Error' });
  }
};

export const getAllRevisions = async (
  req: Request,
  res: Response
): Promise<void> => {
  try {
    if (!req.user) {
      res.status(401).json({ error: 'Not authorized' });
      return;
    }

    const userId = req.user._id;
    const { completed } = req.query;

    const filter: Record<string, unknown> = { user: userId };
    if (completed !== undefined) {
      filter.completed = completed === 'true';
    }

    const revisions = await Revision.find(filter)
      .populate(
        'problem',
        'title topic difficulty platform problemUrl status estimatedTimeMinutes'
      )
      .sort({ scheduledDate: 1 });

    res.status(200).json({
      count: revisions.length,
      revisions,
    });
  } catch (error) {
    console.error('Error fetching revisions:', error);
    res.status(500).json({ error: 'Internal Server Error' });
  }
};

export const createRevision = async (
  req: Request,
  res: Response
): Promise<void> => {
  try {
    if (!req.user) {
      res.status(401).json({ error: 'Not authorized' });
      return;
    }

    const userId = req.user._id;
    const { problemId, intervalDays, scheduledDate } = req.body;

    const problem = await Problem.findOne({ _id: problemId, user: userId });
    if (!problem) {
      res.status(404).json({ error: 'Problem not found or unauthorized' });
      return;
    }

    const baseDate = scheduledDate ? new Date(scheduledDate) : new Date();

    const revision = await scheduleInitialRevision(
      problemId,
      userId,
      intervalDays || 1,
      baseDate
    );

    res.status(201).json({
      message: 'Revision scheduled successfully',
      revision,
    });
  } catch (error) {
    console.error('Error creating revision:', error);
    res.status(500).json({ error: 'Internal Server Error' });
  }
};

export const completeRevision = async (
  req: Request,
  res: Response
): Promise<void> => {
  try {
    if (!req.user) {
      res.status(401).json({ error: 'Not authorized' });
      return;
    }

    const userId = req.user._id;
    const { id: revisionId } = req.params;

    if (!Types.ObjectId.isValid(revisionId)) {
      res.status(400).json({ error: 'Invalid revision ID format' });
      return;
    }

    const result = await completeRevisionAndScheduleNext(revisionId, userId);
    if (!result) {
      res.status(404).json({ error: 'Revision not found or unauthorized' });
      return;
    }

    res.status(200).json({
      message: result.mastered
        ? 'Final revision completed! Problem marked as Mastered.'
        : result.nextRevision
        ? `Revision completed! Next revision scheduled in ${result.nextRevision.intervalDays} days.`
        : 'Revision completed!',
      completedRevision: result.completedRevision,
      nextRevision: result.nextRevision,
      mastered: result.mastered,
    });
  } catch (error) {
    console.error('Error completing revision:', error);
    res.status(500).json({ error: 'Internal Server Error' });
  }
};
