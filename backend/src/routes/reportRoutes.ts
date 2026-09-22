import { Router } from 'express';
import { getWeeklyReport } from '../controllers/reportController';
import { protect } from '../middleware/auth';

export const reportRouter: Router = Router();

// All report routes require authentication
reportRouter.use(protect);

reportRouter.get('/weekly', getWeeklyReport);

export default reportRouter;
