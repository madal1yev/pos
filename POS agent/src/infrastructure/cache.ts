import RedisManager from '../config/redis';
import { APP_CONFIG } from '../config/app';
import logger from './logger';

const TTL_SECONDS = {
  sales_summary: 300,
  inventory: 300,
  products: 600,
  orders: 300,
  customers: 600,
  business_settings: 900,
  agent_response: 120,
  system_status: 60,
  top_products: 600,
};

class CacheManager {
  private redis: ReturnType<typeof RedisManager.getInstance>;

  constructor() {
    this.redis = RedisManager.getInstance();
  }

  async get<T = any>(key: string): Promise<T | null> {
    try {
      if (!RedisManager.isConnected()) return null;
      const value = await this.redis.get(`cache:${key}`);
      return value ? JSON.parse(value) : null;
    } catch (err: any) {
      logger.warn(`Cache get error for ${key}: ${err?.message || String(err)}`);
      return null;
    }
  }

  async set(key: string, value: any, ttlSeconds = TTL_SECONDS[key as keyof typeof TTL_SECONDS] || 300): Promise<void> {
    try {
      if (!RedisManager.isConnected()) return;
      await this.redis.setex(`cache:${key}`, ttlSeconds, JSON.stringify(value));
    } catch (err: any) {
      logger.warn(`Cache set error for ${key}: ${err?.message || String(err)}`);
    }
  }

  async invalidate(pattern: string): Promise<void> {
    try {
      if (!RedisManager.isConnected()) return;
      const keys = await this.redis.keys(`cache:${pattern}`);
      if (keys.length > 0) await this.redis.del(...keys);
    } catch (err: any) {
      logger.warn(`Cache invalidate error: ${err?.message || String(err)}`);
    }
  }

  async invalidateTenant(tenantId: string): Promise<void> {
    await this.invalidate(`tenant:${tenantId}:*`);
    await this.invalidate(`*:${tenantId}:*`);
  }

  getTTL(key: string): number {
    return TTL_SECONDS[key as keyof typeof TTL_SECONDS] || 300;
  }
}

export default new CacheManager();
