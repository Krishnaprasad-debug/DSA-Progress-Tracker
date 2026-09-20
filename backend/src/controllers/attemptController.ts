import { Request, Response } from 'express';
import { Types } from 'mongoose';
import { Attempt } from '../models/Attempt';
import { Problem } from '../models/Problem';
import {
  evaluateStruggleDetection,
  getUserDifficultyAverageTime,
} from '../services/struggleService';

export const createAttempt = async (
  req: Request,
  res: Response
): Promise<void> => {
  try {
    if (!req.user) {
      res.status(401).json({ error: 'Not authorized' });
      return;
    }

    const { id: problemId } = req.params;
    const userId = req.user._id;

    if (!Types.ObjectId.isValid(problemId)) {
      res.status(400).json({ error: 'Invalid problem ID format' });
      return;
    }

    // Ensure problem exists and belongs to the authenticated user
    const problem = await Problem.findOne({ _id: problemId, user: userId });
    if (!problem) {
      res.status(404).json({ error: 'Problem not found or unauthorized' });
      return;
    }

    const { result, timeTakenMinutes, notes } = req.body;

    // Determine the next attempt number for this problem and user
    const existingAttemptsCount = await Attempt.countDocuments({
      problem: problemId,
      user: userId,
    });
    const attemptNumber = existingAttemptsCount + 1;

    // Create the attempt record
    const attempt = new Attempt({
      problem: problemId,
      user: userId,
      attemptNumber,
      result,
      timeTakenMinutes,
      notes: notes || '',
      attemptedAt: new Date(),
    });

    await attempt.save();

    // Cascading updates on Problem:
    // 1. Update lastPracticedAt
    problem.lastPracticedAt = new Date();

    // 2. Cascade status:
    // If Solved and not already Mastered, advance to 'Solved'
    // If Failed and was 'Not Started', advance to 'Attempted'
    if (result === 'Solved') {
      if (problem.status !== 'Mastered') {
        problem.status = 'Solved';
      }
    } else if (result === 'Failed') {
      if (problem.status === 'Not Started') {
        problem.status = 'Attempted';
      }
    }

    await problem.save();

    // Fetch all attempts for this problem to calculate updated struggle status
    const allProblemAttempts = await Attempt.find({
      problem: problemId,
      user: userId,
    }).sort({ attemptNumber: 1 });

    const userDifficultyAvg = await getUserDifficultyAverageTime(
      userId,
      problem.difficulty
    );

    const struggleStatus = evaluateStruggleDetection(
      problem,
      allProblemAttempts,
      userDifficultyAvg
    );

    res.status(201).json({
      message: 'Attempt logged successfully',
      attempt,
      problemStatus: problem.status,
      struggleStatus,
    });
  } catch (error) {
    console.error('Error creating attempt:', error);
    res.status(500).json({ error: 'Internal Server Error' });
  }
};

export const getProblemAttempts = async (
  req: Request,
  res: Response
): Promise<void> => {
  try {
    if (!req.user) {
      res.status(401).json({ error: 'Not authorized' });
      return;
    }

    const { id: problemId } = req.params;
    const userId = req.user._id;

    if (!Types.ObjectId.isValid(problemId)) {
      res.status(400).json({ error: 'Invalid problem ID format' });
      return;
    }

    // Ensure problem exists and belongs to the authenticated user
    const problem = await Problem.findOne({ _id: problemId, user: userId });
    if (!problem) {
      res.status(404).json({ error: 'Problem not found or unauthorized' });
      return;
    }

    // Get all attempts for this problem sorted descending by attempt number
    const attempts = await Attempt.find({
      problem: problemId,
      user: userId,
    }).sort({ attemptNumber: -1 });

    const userDifficultyAvg = await getUserDifficultyAverageTime(
      userId,
      problem.difficulty
    );

    const struggleStatus = evaluateStruggleDetection(
      problem,
      attempts,
      userDifficultyAvg
    );

    res.status(200).json({
      attempts,
      struggleStatus,
      problem: {
        _id: problem._id,
        title: problem.title,
        topic: problem.topic,
        difficulty: problem.difficulty,
        status: problem.status,
        lastPracticedAt: problem.lastPracticedAt,
      },
    });
  } catch (error) {
    console.error('Error fetching attempts:', error);
    res.status(500).json({ error: 'Internal Server Error' });
  }
};
