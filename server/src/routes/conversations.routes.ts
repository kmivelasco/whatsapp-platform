import { Router } from 'express';
import { conversationsController } from '../controllers/conversations.controller';
import { authenticate } from '../middleware/auth';
import { authorize } from '../middleware/rbac';
import { requireActiveSubscription } from '../middleware/subscription';

const router = Router();

router.use(authenticate);
router.use(requireActiveSubscription);

router.get('/', (req, res, next) => conversationsController.list(req, res, next));
router.get('/:id', (req, res, next) => conversationsController.getById(req, res, next));
router.get('/:id/messages', (req, res, next) => conversationsController.getMessages(req, res, next));
router.post('/:id/messages', authorize('ADMIN', 'AGENT'), (req, res, next) => conversationsController.sendMessage(req, res, next));
router.put('/:id/mode', authorize('ADMIN', 'AGENT'), (req, res, next) => conversationsController.updateMode(req, res, next));
router.put('/:id/status', authorize('ADMIN', 'AGENT'), (req, res, next) => conversationsController.updateStatus(req, res, next));
router.put('/:id/assign', authorize('ADMIN'), (req, res, next) => conversationsController.assignAgent(req, res, next));

export default router;
