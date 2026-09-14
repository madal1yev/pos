import { Router } from 'express';
import { db } from '../config/database';
import RedisManager from '../config/redis';
import { posAdapter } from '../modules/pos/pos.adapter';
import { aiProviderManager } from '../modules/ai/ai.provider';
import { automationEngine } from '../modules/automation/automation.engine';
import logger from '../infrastructure/logger';

const r = Router();

function withTimeout<T>(promise: Promise<T>, ms: number, label: string): Promise<{ ok: boolean; value?: T; ms: number }> {
  const start = Date.now();
  return Promise.race([
    promise.then(
      (value) => ({ ok: true, value, ms: Date.now() - start }),
      (err) => ({ ok: false, ms: Date.now() - start, value: undefined as any })
    ),
    new Promise<{ ok: boolean; value?: T; ms: number }>((resolve) =>
      setTimeout(() => resolve({ ok: false, ms, value: undefined }), ms)
    ).then((v) => {
      logger.warn(`Health check timeout: ${label} > ${ms}ms`);
      return v;
    }),
  ]);
}

r.get('/health', async (_req, res) => {
  try {
    const [dbR, redisR, posR, aiR] = await Promise.all([
      withTimeout(db.query('SELECT 1'), 3000, 'db'),
      withTimeout(RedisManager.getHealth(), 3000, 'redis'),
      withTimeout(posAdapter.healthCheck(), 4000, 'pos'),
      withTimeout(aiProviderManager.healthCheck(), 4000, 'ai'),
    ]);

    res.json({
      status: 'ok',
      timestamp: new Date().toISOString(),
      db: dbR.ok && dbR.value && dbR.value.rows.length > 0 ? `connected (${dbR.ms}ms)` : 'error',
      redis: redisR.ok ? redisR.value : { status: 'timeout' },
      pos: posR.ok && posR.value ? 'connected' : 'disconnected',
      ai: aiR.ok ? aiR.value : { openai: 'timeout' },
      automation: automationEngine.isRunning ? 'running' : 'stopped',
      uptime: process.uptime(),
      memory: process.memoryUsage(),
    });
  } catch (err: any) {
    res.status(503).json({ status: 'error', error: err.message });
  }
});

r.get('/ready', async (_req, res) => {
  try {
    await db.query('SELECT 1');
    res.json({ status: 'ready' });
  } catch {
    res.status(503).json({ status: 'not_ready' });
  }
});

r.get('/live', (_req, res) => {
  res.json({ status: 'alive' });
});

export { r as healthRoutes };
