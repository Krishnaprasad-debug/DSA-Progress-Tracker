import { Request, Response } from 'express';
import { goalService } from '../services/goalService';
import { GoalStatus } from '../models/Goal';

export const createGoal = async (req: Request, res: Response): Promise<void> => {
  try {
    if (!req.user) {
      res.status(401).json({ error: 'Not authorized' });
      return;
    }

    const { title, description, type, targetValue, topic, deadline } = req.body;
    const goal = await goalService.createGoal(req.user._id.toString(), {
      title,
      description,
      type,
      targetValue,
      topic,
      deadline,
    });

    res.status(201).json({
      message: 'Goal created successfully',
      goal,
    });
  } catch (error) {
    console.error('Error creating goal:', error);
    res.status(500).json({ error: 'Internal Server Error' });
  }
};

export const getGoals = async (req: Request, res: Response): Promise<void> => {
  try {
    if (!req.user) {
      res.status(401).json({ error: 'Not authorized' });
      return;
    }

    const statusFilter = req.query.status as GoalStatus | undefined;
    const goals = await goalService.getUserGoals(
      req.user._id.toString(),
      statusFilter
    );

    res.status(200).json({
      count: goals.length,
      goals,
    });
  } catch (error) {
    console.error('Error getting goals:', error);
    res.status(500).json({ error: 'Internal Server Error' });
  }
};

export const getGoalById = async (req: Request, res: Response): Promise<void> => {
  try {
    if (!req.user) {
      res.status(401).json({ error: 'Not authorized' });
      return;
    }

    const goal = await goalService.getGoalById(
      req.user._id.toString(),
      req.params.id
    );

    if (!goal) {
      res.status(404).json({ error: 'Goal not found' });
      return;
    }

    res.status(200).json(goal);
  } catch (error) {
    console.error('Error getting goal by ID:', error);
    res.status(500).json({ error: 'Internal Server Error' });
  }
};

export const updateGoal = async (req: Request, res: Response): Promise<void> => {
  try {
    if (!req.user) {
      res.status(401).json({ error: 'Not authorized' });
      return;
    }

    const updated = await goalService.updateGoal(
      req.user._id.toString(),
      req.params.id,
      req.body
    );

    if (!updated) {
      res.status(404).json({ error: 'Goal not found' });
      return;
    }

    res.status(200).json({
      message: 'Goal updated successfully',
      goal: updated,
    });
  } catch (error) {
    console.error('Error updating goal:', error);
    res.status(500).json({ error: 'Internal Server Error' });
  }
};

export const deleteGoal = async (req: Request, res: Response): Promise<void> => {
  try {
    if (!req.user) {
      res.status(401).json({ error: 'Not authorized' });
      return;
    }

    const deleted = await goalService.deleteGoal(
      req.user._id.toString(),
      req.params.id
    );

    if (!deleted) {
      res.status(404).json({ error: 'Goal not found' });
      return;
    }

    res.status(200).json({ message: 'Goal deleted successfully' });
  } catch (error) {
    console.error('Error deleting goal:', error);
    res.status(500).json({ error: 'Internal Server Error' });
  }
};
