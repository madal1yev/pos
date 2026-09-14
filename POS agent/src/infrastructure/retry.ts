import { withRetry } from './error-handler';
import { APP_CONFIG } from '../config/app';
import logger from './logger';

export async function telegramRetry<T>(fn: () => Promise<T>, context = 'telegram'): Promise<T> {
  return withRetry(fn, APP_CONFIG.agentRetryAttempts, APP_CONFIG.agentRetryDelay, context);
}

export async function posApiRetry<T>(fn: () => Promise<T>, context = 'pos-api'): Promise<T> {
  return withRetry(fn, 3, 2000, context);
}

export async function aiRetry<T>(fn: () => Promise<T>, context = 'ai'): Promise<T> {
  return withRetry(fn, APP_CONFIG.agentRetryAttempts, APP_CONFIG.agentRetryDelay * 2, context);
}

export async function dbRetry<T>(fn: () => Promise<T>, context = 'database'): Promise<T> {
  return withRetry(fn, 3, 500, context);
}

export class CircuitBreaker<T> {
  private failures = 0;
  private lastFailureTime = 0;
  private state: 'closed' | 'open' | 'half-open' = 'closed';
  private readonly threshold: number;
  private readonly timeout: number;

  constructor(threshold = 5, timeout = 30000) {
    this.threshold = threshold;
    this.timeout = timeout;
  }

  async call(fn: () => Promise<T>): Promise<T> {
    if (this.state === 'open') {
      if (Date.now() - this.lastFailureTime > this.timeout) {
        this.state = 'half-open';
      } else {
        throw new Error('Circuit breaker is open');
      }
    }

    try {
      const result = await fn();
      this.onSuccess();
      return result;
    } catch (err) {
      this.onFailure();
      throw err;
    }
  }

  private onSuccess(): void {
    this.failures = 0;
    this.state = 'closed';
  }

  private onFailure(): void {
    this.failures++;
    this.lastFailureTime = Date.now();
    if (this.failures >= this.threshold) {
      this.state = 'open';
    }
  }
}
