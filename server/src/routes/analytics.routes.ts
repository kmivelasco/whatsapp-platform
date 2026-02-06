import { Router } from 'express';
import { analyticsController } from '../controllers/analytics.controller';
import { authenticate } from '../middleware/auth';

const router = Router();

router.use(authenticate);

router.get('/summary', (req, res, next) => analyticsController.getSummary(req, res, next));
router.get('/tokens', (req, res, next) => analyticsController.getTokenUsage(req, res, next));
router.get('/costs', (req, res, next) => analyticsController.getCostBreakdown(req, res, next));
router.get('/volume', (req, res, next) => analyticsController.getMessageVolume(req, res, next));
router.get('/response-times', (req, res, next) => analyticsController.getResponseTimes(req, res, next));

export default router;
