import { db } from '../../config/database';
import logger from '../../infrastructure/logger';
import { APP_CONFIG } from '../../config/app';
import { generateRequestId } from '../../common/utils';

export class AuditService {
  async log(input: {
    tenantId: number; userId?: number; action: string; entityType?: string;
    entityId?: number; oldValue?: string; newValue?: string; ipAddress?: string;
    toolName?: string; metadata?: any; requestId?: string;
  }): Promise<any> {
    try {
      const result = await db.run(`
        INSERT INTO audit_logs (tenant_id, user_id, action, entity_type, entity_id, old_value, new_value, ip_address, tool_name, request_id, created_at)
        VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, datetime('now'))
      `, [
        input.tenantId, input.userId, input.action, input.entityType, input.entityId,
        input.oldValue, input.newValue, input.ipAddress, input.toolName, input.requestId || generateRequestId(),
      ]);

      return { id: result.lastInsertRowid, success: true };
    } catch (err: any) {
      logger.error(`Audit log error: ${err?.message || String(err)}`);
      return { success: false };
    }
  }

  async getLogs(tenantId: number, limit = 50, offset = 0): Promise<any[]> {
    const result = await db.query(`
      SELECT * FROM audit_logs WHERE tenant_id = $1 ORDER BY created_at DESC LIMIT $2 OFFSET $3
    `, [tenantId, limit, offset]);
    return result.rows;
  }

  async getSummary(tenantId: number, period = 'today'): Promise<any> {
    const result = await db.query(`
      SELECT action, COUNT(*) as count FROM audit_logs
      WHERE tenant_id = $1 AND DATE(created_at) = DATE('now')
      GROUP BY action ORDER BY count DESC LIMIT 10
    `, [tenantId]);
    return result.rows;
  }
}

export const auditService = new AuditService();
