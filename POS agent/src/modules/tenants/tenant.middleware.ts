import { Request, Response, NextFunction } from 'express';
import { db } from '../../config/database';
import { APP_CONFIG } from '../../config/app';
import logger from '../../infrastructure/logger';

declare global {
  namespace Express {
    interface Request {
      tenantId?: number;
      tenant?: any;
    }
  }
}

export interface TenantContext {
  tenantId: number;
  tenant: any;
}

export function tenantMiddleware(req: Request, res: Response, next: NextFunction): void {
  const tenantId = req.headers['x-tenant-id'] as string || req.query['tenant_id'] as string;
  const authHeader = req.headers.authorization;

  let resolvedTenantId: number;

  if (tenantId) {
    resolvedTenantId = parseInt(tenantId, 10);
  } else if (authHeader) {
    try {
      const token = authHeader.replace('Bearer ', '');
      const payload = JSON.parse(Buffer.from(token.split('.')[1], 'base64').toString());
      resolvedTenantId = payload.tenantId;
    } catch {
      resolvedTenantId = APP_CONFIG.nodeEnv === 'development' ? 1 : 0;
    }
  } else {
    resolvedTenantId = APP_CONFIG.nodeEnv === 'development' ? 1 : 0;
  }

  if (!resolvedTenantId || resolvedTenantId <= 0) {
    res.status(400).json({ error: 'Tenant ID is required' });
    return;
  }

  db.query(`SELECT id, name, slug, timezone, currency, language FROM tenants WHERE id = $1 AND is_active = 1`, [resolvedTenantId])
    .then(result => {
      if (result.rows.length === 0) {
        res.status(404).json({ error: 'Tenant not found' });
        return;
      }
      (req as any).tenant = result.rows[0];
      (req as any).tenantId = result.rows[0].id;
      next();
    })
    .catch(err => {
      logger.error(`Tenant resolution error: ${err.message}`);
      res.status(500).json({ error: 'Failed to resolve tenant' });
    });
}

export function requireTenant(fn: Function) {
  return (req: any, res: any, next: any) => {
    if (!req.tenantId) {
      res.status(400).json({ error: 'Tenant context required' });
      return;
    }
    fn(req, res, next);
  };
}

export const tenantFilter = tenantMiddleware;

export function tenantQueryMiddleware(queryBuilder: (sql: string) => string): (req: any, res: any, next: any) => void {
  return (req: any, res: any, next: any) => {
    if (!req.tenantId) {
      res.status(400).json({ error: 'Tenant context required' });
      return;
    }
    req.tenantFilter = { tenant_id: req.tenantId };
    next();
  };
}
