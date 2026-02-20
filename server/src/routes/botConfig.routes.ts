import { Router } from 'express';
import { botConfigController } from '../controllers/botConfig.controller';
import { authenticate } from '../middleware/auth';
import { authorize } from '../middleware/rbac';
import { requireActiveSubscription } from '../middleware/subscription';

const router = Router();

router.use(authenticate);
router.use(requireActiveSubscription);

router.get('/', (req, res, next) => botConfigController.list(req, res, next));
router.get('/:id', (req, res, next) => botConfigController.getById(req, res, next));
router.post('/', authorize('ADMIN'), (req, res, next) => botConfigController.create(req, res, next));
router.put('/:id', authorize('ADMIN'), (req, res, next) => botConfigController.update(req, res, next));
router.delete('/:id', authorize('ADMIN'), (req, res, next) => botConfigController.delete(req, res, next));

export default router;
