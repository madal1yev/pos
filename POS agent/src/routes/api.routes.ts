import { Router } from 'express';
import { tenantFilter } from '../modules/tenants/tenant.middleware';
import { healthRoutes } from './health.routes';
import { agentRoutes } from './agent.routes';
import { dashboardRoutes } from './dashboard.routes';
import { automationRoutes } from './automation.routes';
import { reportRoutes } from './report.routes';

const router = Router();

router.use('/', healthRoutes);
router.use('/agent', tenantFilter, agentRoutes);
router.use('/dashboard', tenantFilter, dashboardRoutes);
router.use('/automation', tenantFilter, automationRoutes);
router.use('/reports', tenantFilter, reportRoutes);

export { router };
export default router;
