import { db } from '../../config/database';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import { ROLE_HIERARCHY, ROLE_PERMISSIONS } from '../../common/constants';
import { APP_CONFIG } from '../../config/app';
import logger from '../../infrastructure/logger';

export interface IUser {
  id: number;
  tenant_id: number;
  email: string;
  name: string;
  username?: string;
  role_id?: number;
  role?: string;
  role_level: number;
  is_active: boolean;
  is_admin: boolean;
}

export interface ITokenPayload {
  userId: number;
  tenantId: number;
  role: string;
  roleLevel: number;
  isAdmin: boolean;
}

export class AuthService {
  async register(data: {
    tenant_id: number; email: string; name: string; username?: string;
    password: string; role_id?: number;
  }): Promise<{ user: IUser; token: string }> {
    const existing = await db.query(
      `SELECT id FROM users WHERE tenant_id = $1 AND email = $2`, [data.tenant_id, data.email]
    );
    if (existing.rows.length > 0) throw new Error('Email already exists');

    const passwordHash = await bcrypt.hash(data.password, 12);
    const roleLevel = data.role_id ? (ROLE_HIERARCHY[data.role_id.toString() as keyof typeof ROLE_HIERARCHY] || ROLE_HIERARCHY.view) : ROLE_HIERARCHY.view;
    const result = await db.run(
      `INSERT INTO users (tenant_id, email, name, username, password_hash, role_id, is_active, is_admin) VALUES ($1,$2,$3,$4,$5,$6,1,0)`,
      [data.tenant_id, data.email, data.name, data.username || '', passwordHash, data.role_id]
    );

    const user = await this.getUser(result.lastInsertRowid);
    const token = this.generateToken(user);
    return { user, token };
  }

  async login(email: string, password: string): Promise<{ user: IUser; token: string }> {
    const users = await db.query(`SELECT * FROM users WHERE email = $1`, [email]);
    if (users.rows.length === 0) throw new Error('Invalid credentials');

    const user = users.rows[0];
    if (!user.is_active) throw new Error('Account disabled');

    const valid = await bcrypt.compare(password, user.password_hash);
    if (!valid) throw new Error('Invalid credentials');

    const updated = await db.run(`UPDATE users SET last_login_at = datetime('now') WHERE id = $1`, [user.id]);

    const fullUser = await this.getUser(user.id);
    const token = this.generateToken(fullUser);
    return { user: fullUser, token };
  }

  async verifyToken(token: string): Promise<ITokenPayload> {
    try {
      const decoded = jwt.verify(token, APP_CONFIG.apiSecret || 'fallback-secret') as any;
      const blacklisted = await db.query(`SELECT token FROM token_blacklist WHERE token = $1`, [token]);
      if (blacklisted.rows.length > 0) throw new Error('Token blacklisted');
      return decoded;
    } catch (err: any) {
      throw new Error(err.name === 'TokenExpiredError' ? 'Token expired' : 'Invalid token');
    }
  }

  async logout(userId: number, token: string): Promise<void> {
    await db.run(`INSERT INTO token_blacklist (token, expires_at) VALUES ($1, datetime('now', '+24 hours'))`, [token]);
    await db.run(`UPDATE users SET last_login_at = NULL WHERE id = $1`, [userId]);
  }

  async getUser(id: number): Promise<IUser> {
    const result = await db.query(`
      SELECT u.*, r.name as role, r.level as role_level
      FROM users u LEFT JOIN roles r ON u.role_id = r.id
      WHERE u.id = $1
    `, [id]);

    if (result.rows.length === 0) throw new Error('User not found');
    const row = result.rows[0];
    return {
      ...row,
      role_level: row.role_level || 0,
      role: row.role || 'employee',
      is_active: !!row.is_active,
      is_admin: !!row.is_admin,
    };
  }

  generateToken(user: IUser): string {
    const payload: ITokenPayload = {
      userId: user.id,
      tenantId: user.tenant_id,
      role: user.role || 'employee',
      roleLevel: user.role_level || 0,
      isAdmin: user.is_admin || false,
    };
    return jwt.sign(payload, APP_CONFIG.apiSecret || 'fallback-secret', { expiresIn: '24h' });
  }

  getRequiredLevel(role: string): number {
    return ROLE_HIERARCHY[role as keyof typeof ROLE_HIERARCHY] || ROLE_HIERARCHY.view;
  }

  canAccess(requiredLevel: number, userLevel: number): boolean {
    return userLevel >= requiredLevel;
  }
}

export const authService = new AuthService();
