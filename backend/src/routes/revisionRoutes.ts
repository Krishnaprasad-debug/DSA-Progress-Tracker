import { Router } from 'express';
import {
  getRevisionsDueToday,
  getAllRevisions,
  createRevision,
  completeRevision,
} from '../controllers/revisionController';
import { protect } from '../middleware/auth';
import { validateCreateRevision } from '../middleware/validateRevision';

export const revisionRouter: Router = Router();

// All revision routes require authentication
revisionRouter.use(protect);

revisionRouter.get('/today', getRevisionsDueToday);
revisionRouter.get('/', getAllRevisions);
revisionRouter.post('/', validateCreateRevision, createRevision);
revisionRouter.put('/:id/complete', completeRevision);

export default revisionRouter;
