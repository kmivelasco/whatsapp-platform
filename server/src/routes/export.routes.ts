import { Router } from 'express';
import { exportController } from '../controllers/export.controller';
import { authenticate } from '../middleware/auth';
import { authorize } from '../middleware/rbac';
import { requireActiveSubscription } from '../middleware/subscription';

const router = Router();

router.use(authenticate);
router.use(requireActiveSubscription);
router.use(authorize('ADMIN', 'AGENT'));

router.get('/conversations', (req, res, next) => exportController.exportConversations(req, res, next));
router.get('/conversations/:id', (req, res, next) => exportController.exportConversationMessages(req, res, next));
router.get('/analytics', (req, res, next) => exportController.exportAnalytics(req, res, next));

export default router;
