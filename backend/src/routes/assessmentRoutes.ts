import { Router } from 'express';
import {
  createAssessment,
  getUserAssessments,
  getAssessmentById,
  startAssessment,
  submitProblemAttempt,
  finishAssessment,
  deleteAssessment,
} from '../controllers/assessmentController';
import { protect } from '../middleware/auth';
import {
  validateCreateAssessment,
  validateSubmitAttempt,
} from '../middleware/validateAssessment';

export const assessmentRouter: Router = Router();

// All assessment routes require authentication
assessmentRouter.use(protect);

assessmentRouter.post('/', validateCreateAssessment, createAssessment);
assessmentRouter.get('/', getUserAssessments);
assessmentRouter.get('/:id', getAssessmentById);
assessmentRouter.post('/:id/start', startAssessment);
assessmentRouter.post('/:id/submit', validateSubmitAttempt, submitProblemAttempt);
assessmentRouter.post('/:id/finish', finishAssessment);
assessmentRouter.delete('/:id', deleteAssessment);

export default assessmentRouter;
