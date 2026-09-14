import { Router } from 'express';
import { db } from '../config/database';
import cache from '../infrastructure/cache';
import { auditService } from '../modules/audit/audit.service';

const r = Router();

r.get('/overview', async (req, res) => {
  try {
    const tenantId = req.tenantId || 1;
    const cacheKey = `tenant:${tenantId}:dashboard`;
    const cached = await cache.get(cacheKey);
    if (cached) return res.json(cached);

    const [memories, automations, notifications, conversations] = await Promise.all([
      db.query(`SELECT COUNT(*) as cnt FROM memories WHERE tenant_id = $1 AND is_active = 1`, [tenantId]),
      db.query(`SELECT COUNT(*) as cnt FROM automations WHERE tenant_id = $1`, [tenantId]),
      db.query(`SELECT COUNT(*) as cnt FROM notifications WHERE tenant_id = $1`, [tenantId]),
      db.query(`SELECT COUNT(*) as cnt FROM conversations WHERE tenant_id = $1`, [tenantId]),
    ]);

    const data = {
      memories: memories.rows[0],
      automations: automations.rows[0],
      notifications: notifications.rows[0],
      conversations: conversations.rows[0],
    };

    await cache.set(cacheKey, data, 300);
    res.json(data);
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

r.get('/health', async (req, res) => {
  try {
    const tenantId = req.tenantId || 1;
    const [systemEvents, auditLogs, automationRuns] = await Promise.all([
      db.query(`SELECT * FROM system_events ORDER BY created_at DESC LIMIT 10`),
      auditService.getLogs(tenantId, 10),
      db.query(`SELECT * FROM automation_runs WHERE tenant_id = $1 ORDER BY started_at DESC LIMIT 5`, [tenantId]),
    ]);

    res.json({ system_events: systemEvents.rows, recent_audit: auditLogs, automation_runs: automationRuns.rows });
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

export { r as dashboardRoutes };
