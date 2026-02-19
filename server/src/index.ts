import { createServer } from 'http';
import app from './app';
import { env } from './config/env';
import { initializeSocket } from './config/socket';
import { prisma } from './config/database';
import { whatsappWebService } from './services/whatsappWeb.service';

const httpServer = createServer(app);

// Initialize Socket.io
initializeSocket(httpServer);

// Start server
httpServer.listen(env.PORT, () => {
  console.log(`Server running on port ${env.PORT} (${env.NODE_ENV})`);

  // Reconnect saved WhatsApp Web sessions after server starts
  whatsappWebService.reconnectSavedSessions().catch((err) => {
    console.error('[WA-Web] Failed to reconnect sessions:', err);
  });
});

// Graceful shutdown
process.on('SIGTERM', async () => {
  console.log('SIGTERM received, shutting down...');
  await prisma.$disconnect();
  httpServer.close(() => process.exit(0));
});

process.on('SIGINT', async () => {
  console.log('SIGINT received, shutting down...');
  await prisma.$disconnect();
  httpServer.close(() => process.exit(0));
});
