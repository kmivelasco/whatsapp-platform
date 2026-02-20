import { Router } from 'express';
import { usersController } from '../controllers/users.controller';
import { authenticate } from '../middleware/auth';
import { authorize } from '../middleware/rbac';

const router = Router();

router.use(authenticate);

router.post('/', authorize('ADMIN'), (req, res, next) => usersController.create(req, res, next));
router.get('/', authorize('ADMIN'), (req, res, next) => usersController.list(req, res, next));
router.get('/:id', authorize('ADMIN'), (req, res, next) => usersController.getById(req as any, res, next));
router.put('/:id', authorize('ADMIN'), (req, res, next) => usersController.update(req as any, res, next));
router.delete('/:id', authorize('ADMIN'), (req, res, next) => usersController.delete(req as any, res, next));

export default router;
