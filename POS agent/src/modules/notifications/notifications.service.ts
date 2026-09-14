import { db } from '../../config/database';
import logger from '../../infrastructure/logger';
import { APP_CONFIG } from '../../config/app';
import { withRetry } from '../../infrastructure/error-handler';
import cache from '../../infrastructure/cache';

export class NotificationsService {
  async send(data: {
    tenantId: number; userId?: number; type: string;
    title: string; message: string; channel?: string; scheduledAt?: Date; metadata?: any;
  }): Promise<any> {
    try {
      const result = await db.run(`
        INSERT INTO notifications (tenant_id, type, title, message, channel, status, scheduled_at)
        VALUES ($1, $2, $3, $4, $5, 'sent', $6)
      `, [data.tenantId, data.type, data.title, data.message, data.channel || 'telegram', data.scheduledAt || new Date()]);

      await cache.invalidate(`tenant:${data.tenantId}:notifications`);
      return { id: result.lastInsertRowid, success: true };
    } catch (err) {
      logger.error(`Notification send error: ${err}`);
      return { success: false, error: err };
    }
  }

  async sendToOwner(title: string, message: string): Promise<any> {
    return this.send({
      tenantId: 1,
      type: 'owner_alert',
      title,
      message,
      channel: 'telegram',
    });
  }

  async getPending(tenantId: number): Promise<any[]> {
    const result = await db.query(`
      SELECT * FROM notifications WHERE tenant_id = $1 AND status = 'pending' AND scheduled_at <= datetime('now') ORDER BY created_at ASC
    `, [tenantId]);
    return result.rows;
  }

  async markSent(id: number): Promise<void> {
    await db.run(`UPDATE notifications SET status = 'sent', sent_at = datetime('now') WHERE id = $1`, [id]);
  }

  async getHistory(tenantId: number, limit = 20): Promise<any[]> {
    const result = await db.query(`
      SELECT * FROM notifications WHERE tenant_id = $1 ORDER BY created_at DESC LIMIT $2
    `, [tenantId, limit]);
    return result.rows;
  }
}

export const notificationsService = new NotificationsService();
