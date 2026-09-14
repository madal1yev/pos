import { db } from '../../config/database';
import cache from '../../infrastructure/cache';
import logger from '../../infrastructure/logger';
import { APP_CONFIG } from '../../config/app';
import { sanitizeInput } from '../../common/utils';

export class MemoryService {
  async retrieve(input: {
    tenantId: number;
    query?: string;
    conversationId?: number;
    limit?: number;
    types?: string[];
  }): Promise<any[]> {
    const { tenantId, query, conversationId, limit = 10, types } = input;

    try {
      let sql = `SELECT * FROM memories WHERE tenant_id = $1 AND is_active = 1`;
      const params: any[] = [tenantId];
      let paramIdx = 2;

      if (query) {
        sql += ` AND content LIKE $${paramIdx++}`;
        params.push(`%${query}%`);
      }
      if (conversationId) {
        sql += ` AND conversation_id = $${paramIdx++}`;
        params.push(conversationId);
      }
      if (types && types.length > 0) {
        const placeholders = types.map(() => `$${paramIdx++}`).join(',');
        sql += ` AND type IN (${placeholders})`;
        params.push(...types);
      }

      sql += ` ORDER BY importance DESC, created_at DESC LIMIT $${paramIdx++}`;
      params.push(limit);

      const result = await db.query(sql, params);
      return result.rows;
    } catch (err: any) {
      logger.error(`Memory retrieve error: ${err?.message || String(err)}`);
      return [];
    }
  }

  async add(input: {
    tenantId: number;
    conversationId?: number;
    type: string;
    content: string;
    importance?: number;
    tags?: string[];
    source?: string;
    expiresAt?: string;
  }): Promise<any> {
    try {
      const content = sanitizeInput(input.content);
      const result = await db.run(`
        INSERT INTO memories (tenant_id, conversation_id, type, content, importance, tags, source, expires_at)
        VALUES ($1, $2, $3, $4, $5, $6, $7, $8)
      `, [
        input.tenantId,
        input.conversationId,
        input.type,
        content,
        input.importance || 5,
        JSON.stringify(input.tags || []),
        input.source || null,
        input.expiresAt || null,
      ]);

      await cache.invalidate(`tenant:${input.tenantId}:memory`);
      return { id: result.lastInsertRowid, success: true };
    } catch (err: any) {
      logger.error(`Memory add error: ${err?.message || String(err)}`);
      return { success: false, error: err?.message || String(err) };
    }
  }

  async update(input: {
    id: number; tenantId: number; content?: string; importance?: number; tags?: string[];
  }): Promise<any> {
    try {
      const updates: string[] = [];
      const params: any[] = [];
      let idx = 1;

      if (input.content !== undefined) {
        updates.push(`content = $${idx++}`);
        params.push(sanitizeInput(input.content));
      }
      if (input.importance !== undefined) {
        updates.push(`importance = $${idx++}`);
        params.push(input.importance);
      }
      if (input.tags !== undefined) {
        updates.push(`tags = $${idx++}`);
        params.push(JSON.stringify(input.tags));
      }

      if (updates.length === 0) return { success: false };

      params.push(input.id, input.tenantId);
      await db.run(`UPDATE memories SET ${updates.join(', ')}, updated_at = datetime('now') WHERE id = $${idx} AND tenant_id = $${idx + 1}`, params);

      await cache.invalidate(`tenant:${input.tenantId}:memory`);
      return { success: true };
    } catch (err: any) {
      logger.error(`Memory update error: ${err?.message || String(err)}`);
      return { success: false };
    }
  }

  async delete(id: number, tenantId: number): Promise<any> {
    try {
      await db.run(`UPDATE memories SET is_active = 0 WHERE id = $1 AND tenant_id = $2`, [id, tenantId]);
      return { success: true };
    } catch (err: any) {
      logger.error(`Memory delete error: ${err?.message || String(err)}`);
      return { success: false };
    }
  }

  async summarize(tenantId: number, conversationId: number): Promise<string> {
    try {
      const memories = await this.retrieve({
        tenantId, conversationId, limit: 50,
        types: ['conversation', 'important_fact'],
      });

      if (memories.length === 0) return '';
      if (memories.length <= 5) {
        return memories.map((m: any) => m.content).join('\n');
      }

      const sorted = memories.sort((a: any, b: any) => b.importance - a.importance);
      return sorted.slice(0, 10).map((m: any) => `[${m.type}]: ${m.content}`).join('\n');
    } catch (err: any) {
      logger.error(`Memory summarize error: ${err?.message || String(err)}`);
      return '';
    }
  }
}

export const memoryService = new MemoryService();
