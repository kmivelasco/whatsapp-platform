import { Router } from 'express';
import { organizationController } from '../controllers/organization.controller';
import { authenticate } from '../middleware/auth';
import { authorize } from '../middleware/rbac';

const router = Router();

// All organization routes require platform admin
router.use(authenticate);
router.use(authorize('ADMIN'));

router.get('/', (req, res, next) => organizationController.list(req, res, next));
router.post('/', (req, res, next) => organizationController.create(req, res, next));
router.get('/:id', (req, res, next) => organizationController.getById(req, res, next));
router.put('/:id', (req, res, next) => organizationController.update(req, res, next));
router.delete('/:id', (req, res, next) => organizationController.delete(req, res, next));

export default router;
