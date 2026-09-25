import { Request, Response } from 'express';
import { assessmentService } from '../services/assessmentService';
import { AssessmentStatus } from '../models/Assessment';

export const createAssessment = async (
  req: Request,
  res: Response
): Promise<void> => {
  try {
    if (!req.user) {
      res.status(401).json({ error: 'Not authorized' });
      return;
    }

    const { title, description, durationMinutes, problemIds } = req.body;
    const assessment = await assessmentService.createAssessment(
      req.user._id.toString(),
      {
        title,
        description,
        durationMinutes,
        problemIds,
      }
    );

    res.status(201).json({
      message: 'Assessment created successfully',
      assessment,
    });
  } catch (error: unknown) {
    const msg = error instanceof Error ? error.message : 'Internal Server Error';
    console.error('Error creating assessment:', msg);
    res.status(500).json({ error: msg });
  }
};

export const getUserAssessments = async (
  req: Request,
  res: Response
): Promise<void> => {
  try {
    if (!req.user) {
      res.status(401).json({ error: 'Not authorized' });
      return;
    }

    const statusFilter = req.query.status as AssessmentStatus | undefined;
    const assessments = await assessmentService.getUserAssessments(
      req.user._id.toString(),
      statusFilter
    );

    res.status(200).json({
      count: assessments.length,
      assessments,
    });
  } catch (error) {
    console.error('Error getting assessments:', error);
    res.status(500).json({ error: 'Internal Server Error' });
  }
};

export const getAssessmentById = async (
  req: Request,
  res: Response
): Promise<void> => {
  try {
    if (!req.user) {
      res.status(401).json({ error: 'Not authorized' });
      return;
    }

    const result = await assessmentService.getAssessmentById(
      req.user._id.toString(),
      req.params.id
    );

    if (!result) {
      res.status(404).json({ error: 'Assessment not found' });
      return;
    }

    res.status(200).json(result);
  } catch (error) {
    console.error('Error getting assessment by ID:', error);
    res.status(500).json({ error: 'Internal Server Error' });
  }
};

export const startAssessment = async (
  req: Request,
  res: Response
): Promise<void> => {
  try {
    if (!req.user) {
      res.status(401).json({ error: 'Not authorized' });
      return;
    }

    const assessment = await assessmentService.startAssessment(
      req.user._id.toString(),
      req.params.id
    );

    if (!assessment) {
      res.status(404).json({ error: 'Assessment not found' });
      return;
    }

    res.status(200).json({
      message: 'Assessment started',
      assessment,
    });
  } catch (error) {
    console.error('Error starting assessment:', error);
    res.status(500).json({ error: 'Internal Server Error' });
  }
};

export const submitProblemAttempt = async (
  req: Request,
  res: Response
): Promise<void> => {
  try {
    if (!req.user) {
      res.status(401).json({ error: 'Not authorized' });
      return;
    }

    const { problemId, result, timeTakenMinutes, notes } = req.body;
    const assessment = await assessmentService.submitProblemAttempt(
      req.user._id.toString(),
      req.params.id,
      {
        problemId,
        result,
        timeTakenMinutes,
        notes,
      }
    );

    if (!assessment) {
      res.status(404).json({ error: 'Assessment not found' });
      return;
    }

    res.status(200).json({
      message: 'Attempt submitted',
      assessment,
    });
  } catch (error: unknown) {
    const msg = error instanceof Error ? error.message : 'Internal Server Error';
    console.error('Error submitting assessment attempt:', msg);
    res.status(400).json({ error: msg });
  }
};

export const finishAssessment = async (
  req: Request,
  res: Response
): Promise<void> => {
  try {
    if (!req.user) {
      res.status(401).json({ error: 'Not authorized' });
      return;
    }

    const assessment = await assessmentService.finishAssessment(
      req.user._id.toString(),
      req.params.id
    );

    if (!assessment) {
      res.status(404).json({ error: 'Assessment not found' });
      return;
    }

    res.status(200).json({
      message: 'Assessment completed',
      assessment,
    });
  } catch (error) {
    console.error('Error finishing assessment:', error);
    res.status(500).json({ error: 'Internal Server Error' });
  }
};

export const deleteAssessment = async (
  req: Request,
  res: Response
): Promise<void> => {
  try {
    if (!req.user) {
      res.status(401).json({ error: 'Not authorized' });
      return;
    }

    const deleted = await assessmentService.deleteAssessment(
      req.user._id.toString(),
      req.params.id
    );

    if (!deleted) {
      res.status(404).json({ error: 'Assessment not found' });
      return;
    }

    res.status(200).json({ message: 'Assessment deleted successfully' });
  } catch (error) {
    console.error('Error deleting assessment:', error);
    res.status(500).json({ error: 'Internal Server Error' });
  }
};
