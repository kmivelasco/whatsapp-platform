import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import { env } from './config/env';
import { apiLimiter } from './middleware/rateLimiter';
import { errorHandler } from './middleware/errorHandler';

import authRoutes from './routes/auth.routes';
import usersRoutes from './routes/users.routes';
import conversationsRoutes from './routes/conversations.routes';
import messagesRoutes from './routes/messages.routes';
import webhookRoutes from './routes/webhook.routes';
import analyticsRoutes from './routes/analytics.routes';
import botConfigRoutes from './routes/botConfig.routes';
import exportRoutes from './routes/export.routes';

const app = express();

// Security
app.use(helmet());
app.use(cors({ origin: env.CORS_ORIGIN, credentials: true }));

// Body parsing
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true }));

// Rate limiting on API routes
app.use('/api', apiLimiter);

// Health check
app.get('/api/health', (_req, res) => {
  res.json({ status: 'ok', timestamp: new Date().toISOString() });
});

// Routes
app.use('/api/auth', authRoutes);
app.use('/api/users', usersRoutes);
app.use('/api/conversations', conversationsRoutes);
app.use('/api/messages', messagesRoutes);
app.use('/api/webhook', webhookRoutes);
app.use('/api/analytics', analyticsRoutes);
app.use('/api/bot-configs', botConfigRoutes);
app.use('/api/export', exportRoutes);

// Error handler (must be last)
app.use(errorHandler);

export default app;
