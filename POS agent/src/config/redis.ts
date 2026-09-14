import dotenv from 'dotenv';
dotenv.config();

class RedisManager {
  private static instance: any = null;
  private static connected: boolean = false;

  static getInstance(): any {
    if (!this.instance) {
      const IORedis = require('ioredis');
      this.instance = new IORedis(process.env.REDIS_URL || 'redis://localhost:6379', {
        maxRetriesPerRequest: 3,
        enableReadyCheck: true,
        lazyConnect: false,
        connectTimeout: 10000,
        commandTimeout: 5000,
      });

      this.instance.on('connect', () => {
        this.connected = true;
        console.log('✅ Redis connected');
      });

      this.instance.on('error', (err: Error) => {
        console.error('❌ Redis error:', err.message);
        this.connected = false;
      });

      this.instance.on('close', () => {
        this.connected = false;
        console.log('⚠️ Redis disconnected');
      });
    }
    return this.instance;
  }

  static isConnected(): boolean {
    return this.connected && this.instance?.status === 'ready';
  }

  static async getHealth(): Promise<any> {
    try {
      const ping = await this.getInstance().ping();
      return { status: 'ok', redis: ping };
    } catch (e: any) {
      return { status: 'error', error: e.message };
    }
  }
}

export default RedisManager;
