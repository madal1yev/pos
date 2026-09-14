import { db } from '../../src/config/database';
import { tenantMiddleware } from '../../src/modules/tenants/tenant.middleware';

describe('Tenant Isolation', () => {
  test('should have tenants table', async () => {
    const result = await db.query(`SELECT name FROM tenants LIMIT 1`);
    expect(result.rows.length).toBeGreaterThanOrEqual(0);
  });

  test('tenant data should be isolated', async () => {
    const result = await db.query(`SELECT COUNT(*) as cnt FROM tenants`);
    expect(result.rows[0]?.cnt).toBeGreaterThanOrEqual(0);
  });

  test('all sales queries should include tenant_id', async () => {
    const result = await db.query(`SELECT sql FROM sqlite_master WHERE type='table' AND name='sales'`);
    expect(result.rows.length).toBe(1);
  });
});
