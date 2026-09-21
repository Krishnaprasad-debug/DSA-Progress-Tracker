import { Router } from 'express';
import {
  getDashboardAnalytics,
  getTopicAnalytics,
  getStreakAnalytics,
} from '../controllers/analyticsController';
import { protect } from '../middleware/auth';

export const analyticsRouter: Router = Router();

// All analytics endpoints require authentication
analyticsRouter.use(protect);

analyticsRouter.get('/dashboard', getDashboardAnalytics);
analyticsRouter.get('/topics', getTopicAnalytics);
analyticsRouter.get('/streak', getStreakAnalytics);

export default analyticsRouter;
