import 'dotenv/config';
import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import rateLimit from 'express-rate-limit';
import path from 'path';
import { APP_CONFIG } from './config/app';
import { db } from './config/database';
import logger from './infrastructure/logger';
import { rateLimiter } from './infrastructure/rate-limiter';
import { errorHandler } from './infrastructure/error-handler';
import { tenantMiddleware } from './modules/tenants/tenant.middleware';
import { router } from './routes/api.routes';

const app = express();
let server: any;
let isShuttingDown = false;

app.use(helmet());
app.use(cors({ origin: '*', credentials: true }));
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true }));
app.use('/uploads', express.static(path.join(__dirname, '../uploads')));
app.use(rateLimiter);
app.use(tenantMiddleware);
app.use('/api', router);

app.use((req: any, res: any) => {
  if (req.path.startsWith('/api/')) {
    res.status(404).json({ error: 'Not found' });
    return;
  }
  res.json({ name: 'POS AI Agent Platform', version: '1.0.0', status: 'running' });
});

app.use(errorHandler);

async function startServer(): Promise<void> {
  try {
    server = app.listen(APP_CONFIG.port, '0.0.0.0', () => {
      logger.info(`🚀 POS AI Agent running on port ${APP_CONFIG.port}`);
      logger.info(`📊 Health: http://localhost:${APP_CONFIG.port}/api/health`);
    });
    server.on('error', (err: any) => {
      if (err.code === 'EADDRINUSE') {
        logger.error(`Port ${APP_CONFIG.port} is in use`);
        process.exit(1);
      }
      throw err;
    });
    logger.info('✅ Server started successfully');
  } catch (err) {
    logger.error(`Server start error: ${err}`);
    process.exit(1);
  }
}

async function gracefulShutdown(signal: string): Promise<void> {
  if (isShuttingDown) return;
  isShuttingDown = true;
  logger.info(`🛑 ${signal} received. Starting graceful shutdown...`);
  if (server) { await new Promise(resolve => server.close(resolve)); }
  await db.close?.();
  logger.info('✅ Graceful shutdown complete');
  process.exit(0);
}

process.on('SIGTERM', () => gracefulShutdown('SIGTERM'));
process.on('SIGINT', () => gracefulShutdown('SIGINT'));
process.on('uncaughtException', (err) => { logger.error(`Uncaught: ${err.message}`); gracefulShutdown('uncaughtException'); });
process.on('unhandledRejection', (reason) => { logger.error(`Unhandled: ${reason}`); });

startServer();
export default app;
