import { Router } from 'express';
import { db } from '../config/database';
import { reportsService } from '../modules/reports/reports.service';

const r = Router();

r.get('/', async (req, res) => {
  try {
    const result = await db.query(`SELECT * FROM reports WHERE tenant_id = $1 ORDER BY created_at DESC LIMIT 20`, [req.tenantId || 1]);
    res.json(result.rows);
  } catch (err: any) { res.status(500).json({ error: err.message }); }
});

r.post('/generate/:type', async (req, res) => {
  try {
    const { type } = req.params;
    const generateFn = type === 'daily'
      ? reportsService.generateDaily.bind(reportsService)
      : type === 'weekly'
        ? reportsService.generateWeekly.bind(reportsService)
        : reportsService.generateMonthly.bind(reportsService);
    const data = await generateFn(req.tenantId || 1);
    const text = await reportsService.generateTextReport(data, type);
    res.json({ data, text });
  } catch (err: any) { res.status(500).json({ error: err.message }); }
});

export { r as reportRoutes };
