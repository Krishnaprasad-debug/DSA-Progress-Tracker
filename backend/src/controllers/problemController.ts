import { Request, Response } from 'express';
import mongoose, { FilterQuery } from 'mongoose';
import { Problem, IProblem } from '../models/Problem';

export const getProblems = async (req: Request, res: Response): Promise<void> => {
  try {
    const userId = req.user!._id;
    const { search, topic, difficulty, status, platform, sortBy = 'createdAt', sortOrder = 'desc' } = req.query;

    const filter: FilterQuery<IProblem> = { user: userId };

    if (search && typeof search === 'string') {
      filter.$or = [
        { title: { $regex: search, $options: 'i' } },
        { notes: { $regex: search, $options: 'i' } },
        { tags: { $in: [new RegExp(search, 'i')] } },
      ];
    }

    if (topic && typeof topic === 'string') {
      filter.topic = topic;
    }

    if (difficulty && typeof difficulty === 'string') {
      filter.difficulty = difficulty;
    }

    if (status && typeof status === 'string') {
      filter.status = status;
    }

    if (platform && typeof platform === 'string') {
      filter.platform = platform;
    }

    const sortOptions: Record<string, 1 | -1> = {
      [sortBy as string]: sortOrder === 'asc' ? 1 : -1,
    };

    const problems = await Problem.find(filter).sort(sortOptions);

    res.status(200).json({
      count: problems.length,
      problems,
    });
  } catch (error) {
    console.error('Error fetching problems:', error);
    res.status(500).json({ error: 'Internal Server Error' });
  }
};

export const getProblemById = async (req: Request, res: Response): Promise<void> => {
  try {
    const { id } = req.params;

    if (!mongoose.Types.ObjectId.isValid(id)) {
      res.status(400).json({ error: 'Invalid problem ID format' });
      return;
    }

    const problem = await Problem.findOne({ _id: id, user: req.user!._id });
    if (!problem) {
      res.status(404).json({ error: 'Problem not found' });
      return;
    }

    res.status(200).json({ problem });
  } catch (error) {
    console.error('Error fetching problem by id:', error);
    res.status(500).json({ error: 'Internal Server Error' });
  }
};

export const createProblem = async (req: Request, res: Response): Promise<void> => {
  try {
    const {
      title,
      description,
      topic,
      difficulty,
      platform,
      problemUrl,
      status,
      notes,
      tags,
      estimatedTimeMinutes,
    } = req.body;

    const problem = await Problem.create({
      user: req.user!._id,
      title: title.trim(),
      description: description ? description.trim() : '',
      topic,
      difficulty,
      platform: platform || 'LeetCode',
      problemUrl: problemUrl ? problemUrl.trim() : '',
      status: status || 'Not Started',
      notes: notes ? notes.trim() : '',
      tags: Array.isArray(tags) ? tags : [],
      estimatedTimeMinutes: estimatedTimeMinutes || 30,
    });

    res.status(201).json({
      message: 'Problem created successfully',
      problem,
    });
  } catch (error) {
    console.error('Error creating problem:', error);
    res.status(500).json({ error: 'Internal Server Error' });
  }
};

export const updateProblem = async (req: Request, res: Response): Promise<void> => {
  try {
    const { id } = req.params;

    if (!mongoose.Types.ObjectId.isValid(id)) {
      res.status(400).json({ error: 'Invalid problem ID format' });
      return;
    }

    const problem = await Problem.findOne({ _id: id, user: req.user!._id });
    if (!problem) {
      res.status(404).json({ error: 'Problem not found' });
      return;
    }

    const fieldsToUpdate = [
      'title',
      'description',
      'topic',
      'difficulty',
      'platform',
      'problemUrl',
      'status',
      'notes',
      'tags',
      'estimatedTimeMinutes',
      'lastPracticedAt',
    ];

    fieldsToUpdate.forEach((field) => {
      if (req.body[field] !== undefined) {
        problem.set(field, req.body[field]);
      }
    });

    await problem.save();

    res.status(200).json({
      message: 'Problem updated successfully',
      problem,
    });
  } catch (error) {
    console.error('Error updating problem:', error);
    res.status(500).json({ error: 'Internal Server Error' });
  }
};

export const deleteProblem = async (req: Request, res: Response): Promise<void> => {
  try {
    const { id } = req.params;

    if (!mongoose.Types.ObjectId.isValid(id)) {
      res.status(400).json({ error: 'Invalid problem ID format' });
      return;
    }

    const result = await Problem.findOneAndDelete({ _id: id, user: req.user!._id });
    if (!result) {
      res.status(404).json({ error: 'Problem not found' });
      return;
    }

    res.status(200).json({ message: 'Problem deleted successfully' });
  } catch (error) {
    console.error('Error deleting problem:', error);
    res.status(500).json({ error: 'Internal Server Error' });
  }
};
