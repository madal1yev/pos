import { Router } from 'express';
import { db } from '../config/database';
import { automationEngine } from '../modules/automation/automation.engine';

const r = Router();

r.get('/', async (req, res) => {
  try {
    const result = await db.query(`SELECT * FROM automations WHERE tenant_id = $1 ORDER BY created_at DESC`, [req.tenantId || 1]);
    res.json(result.rows);
  } catch (err: any) { res.status(500).json({ error: err.message }); }
});

r.post('/', async (req, res) => {
  try {
    const { name, trigger_type, trigger_config, action_type, action_config } = req.body;
    const result = await automationEngine.createRule({ tenant_id: req.tenantId || 1, name, trigger_type, trigger_config, action_type, action_config });
    res.json(result);
  } catch (err: any) { res.status(500).json({ error: err.message }); }
});

r.delete('/:id', async (req, res) => {
  try {
    await automationEngine.deleteRule(parseInt(req.params.id, 10), req.tenantId || 1);
    res.json({ success: true });
  } catch (err: any) { res.status(500).json({ error: err.message }); }
});

r.get('/runs', async (req, res) => {
  try {
    const result = await db.query(`SELECT * FROM automation_runs WHERE tenant_id = $1 ORDER BY started_at DESC LIMIT 20`, [req.tenantId || 1]);
    res.json(result.rows);
  } catch (err: any) { res.status(500).json({ error: err.message }); }
});

export { r as automationRoutes };
