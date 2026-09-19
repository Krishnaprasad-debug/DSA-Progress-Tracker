import { Router } from 'express';
import {
  getProblems,
  getProblemById,
  createProblem,
  updateProblem,
  deleteProblem,
} from '../controllers/problemController';
import { protect } from '../middleware/auth';
import { validateCreateProblem, validateUpdateProblem } from '../middleware/validateProblem';

export const problemRouter: Router = Router();

// Guard all problem management endpoints with cookie auth middleware
problemRouter.use(protect);

problemRouter.get('/', getProblems);
problemRouter.post('/', validateCreateProblem, createProblem);
problemRouter.get('/:id', getProblemById);
problemRouter.put('/:id', validateUpdateProblem, updateProblem);
problemRouter.delete('/:id', deleteProblem);

export default problemRouter;
