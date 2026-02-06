import { Router } from 'express';
import { messagesController } from '../controllers/messages.controller';
import { authenticate } from '../middleware/auth';

const router = Router();

router.use(authenticate);

router.get('/search', (req, res, next) => messagesController.search(req, res, next));

export default router;
