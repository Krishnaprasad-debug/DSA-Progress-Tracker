import { Request, Response } from 'express';
import { reportService } from '../services/reportService';

export const getWeeklyReport = async (
  req: Request,
  res: Response
): Promise<void> => {
  try {
    if (!req.user) {
      res.status(401).json({ error: 'Not authorized' });
      return;
    }

    const report = await reportService.getWeeklyReport(req.user._id.toString());
    res.status(200).json(report);
  } catch (error) {
    console.error('Error generating weekly report:', error);
    res.status(500).json({ error: 'Internal Server Error' });
  }
};
