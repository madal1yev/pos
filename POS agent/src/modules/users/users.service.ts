import { db } from '../../config/database';
import bcrypt from 'bcryptjs';
import { ROLE_HIERARCHY, ROLE_PERMISSIONS } from '../../common/constants';
import { generateId, generateToken } from '../../common/utils';
import { authService } from '../auth/auth.service';
import { TenantContext } from '../tenants/tenant.middleware';

export interface IUser {
  id: number; tenant_id: number; email: string; name: string; role?: string; role_level: number; is_active: boolean; is_admin: boolean;
}

export class UsersService {
  async list(tenantId: number): Promise<any[]> {
    const result = await db.query(`
      SELECT u.id, u.email, u.name, u.username, u.is_active, r.name as role, u.is_admin
      FROM users u LEFT JOIN roles r ON u.role_id = r.id WHERE u.tenant_id = $1 ORDER BY u.created_at DESC
    `, [tenantId]);
    return result.rows;
  }

  async getById(id: number, tenantId: number): Promise<any | null> {
    const result = await db.query(`
      SELECT u.id, u.email, u.name, u.username, u.is_active, r.name as role, u.is_admin
      FROM users u LEFT JOIN roles r ON u.role_id = r.id WHERE u.id = $1 AND u.tenant_id = $2
    `, [id, tenantId]);
    return result.rows[0] || null;
  }

  async create(tenantId: number, data: { email: string; name: string; username?: string; password: string; role_id?: number }): Promise<any> {
    const existing = await db.query(`SELECT id FROM users WHERE tenant_id = $1 AND email = $2`, [tenantId, data.email]);
    if (existing.rows.length > 0) throw new Error('Email already exists');

    const passwordHash = await bcrypt.hash(data.password, 12);
    const result = await db.run(`
      INSERT INTO users (tenant_id, email, name, username, password_hash, role_id, is_active) VALUES ($1,$2,$3,$4,$5,$6,1)
    `, [tenantId, data.email, data.name, data.username || '', passwordHash, data.role_id]);

    return { id: result.lastInsertRowid, success: true };
  }

  async update(id: number, tenantId: number, data: Partial<{ name: string; username: string; role_id: number; is_active: boolean }>): Promise<any> {
    const updates: string[] = [];
    const params: any[] = [];
    let idx = 1;

    if (data.name !== undefined) { updates.push(`name = $${idx++}`); params.push(data.name); }
    if (data.username !== undefined) { updates.push(`username = $${idx++}`); params.push(data.username); }
    if (data.role_id !== undefined) { updates.push(`role_id = $${idx++}`); params.push(data.role_id); }
    if (data.is_active !== undefined) { updates.push(`is_active = $${idx++}`); params.push(data.is_active); }

    if (updates.length === 0) return { success: false };

    params.push(id, tenantId);
    await db.run(`UPDATE users SET ${updates.join(', ')} WHERE id = $${idx} AND tenant_id = $${idx + 1}`, params);
    return { success: true };
  }

  async delete(id: number, tenantId: number): Promise<any> {
    await db.run(`DELETE FROM users WHERE id = $1 AND tenant_id = $2`, [id, tenantId]);
    return { success: true };
  }

  getUserPermissions(userId: number, tenantId: number): string[] {
    const user = { role: 'employee' };
    const role = ROLE_PERMISSIONS[user.role] || ROLE_PERMISSIONS.employee;
    return role;
  }
}

export const usersService = new UsersService();
