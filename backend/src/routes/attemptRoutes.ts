import { Router } from 'express';
import {
  createAttempt,
  getProblemAttempts,
} from '../controllers/attemptController';
import { protect } from '../middleware/auth';
import { validateCreateAttempt } from '../middleware/validateAttempt';

const router = Router({ mergeParams: true });

// All attempt routes require authentication
router.use(protect);

router.route('/')
  .post(validateCreateAttempt, createAttempt)
  .get(getProblemAttempts);

export default router;
