import { Router } from 'express';
import {
  createGoal,
  getGoals,
  getGoalById,
  updateGoal,
  deleteGoal,
} from '../controllers/goalController';
import { protect } from '../middleware/auth';
import {
  validateCreateGoal,
  validateUpdateGoal,
} from '../middleware/validateGoal';

export const goalRouter: Router = Router();

// All goal routes require authentication
goalRouter.use(protect);

goalRouter.post('/', validateCreateGoal, createGoal);
goalRouter.get('/', getGoals);
goalRouter.get('/:id', getGoalById);
goalRouter.put('/:id', validateUpdateGoal, updateGoal);
goalRouter.delete('/:id', deleteGoal);

export default goalRouter;
