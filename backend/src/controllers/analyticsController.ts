import { Request, Response } from 'express';
import {
  getUserDashboardAnalytics,
  getUserTopicAnalytics,
  calculateStreaks,
} from '../services/analyticsService';
import { Attempt } from '../models/Attempt';

export const getDashboardAnalytics = async (
  req: Request,
  res: Response
): Promise<void> => {
  try {
    if (!req.user) {
      res.status(401).json({ error: 'Not authorized' });
      return;
    }

    const userId = req.user._id;
    const analytics = await getUserDashboardAnalytics(userId);

    res.status(200).json(analytics);
  } catch (error) {
    console.error('Error fetching dashboard analytics:', error);
    res.status(500).json({ error: 'Internal Server Error' });
  }
};

export const getTopicAnalytics = async (
  req: Request,
  res: Response
): Promise<void> => {
  try {
    if (!req.user) {
      res.status(401).json({ error: 'Not authorized' });
      return;
    }

    const userId = req.user._id;
    const topics = await getUserTopicAnalytics(userId);

    res.status(200).json({
      count: topics.length,
      topics,
    });
  } catch (error) {
    console.error('Error fetching topic analytics:', error);
    res.status(500).json({ error: 'Internal Server Error' });
  }
};

export const getStreakAnalytics = async (
  req: Request,
  res: Response
): Promise<void> => {
  try {
    if (!req.user) {
      res.status(401).json({ error: 'Not authorized' });
      return;
    }

    const userId = req.user._id;
    const attempts = await Attempt.find({ user: userId }).select('attemptedAt');
    const streakData = calculateStreaks(attempts.map((a) => a.attemptedAt));

    res.status(200).json(streakData);
  } catch (error) {
    console.error('Error fetching streak analytics:', error);
    res.status(500).json({ error: 'Internal Server Error' });
  }
};
