import { Request, Response, NextFunction } from 'express';
import { APP_CONFIG } from '../config/app';

const store: Record<string, { count: number; firstRequest: number }> = {};
const WINDOW_MS = APP_CONFIG.rateLimitWindowMs;
const MAX_REQUESTS = APP_CONFIG.rateLimitMax;

export function rateLimiter(req: Request, res: Response, next: NextFunction): void {
  const key = String(req.ip || req.headers['x-forwarded-for'] || 'unknown');
  const now = Date.now();

  if (!store[key]) {
    store[key] = { count: 1, firstRequest: now };
    return next();
  }

  if (now - store[key].firstRequest > WINDOW_MS) {
    store[key] = { count: 1, firstRequest: now };
    return next();
  }

  store[key].count++;
  if (store[key].count > MAX_REQUESTS) {
    res.set('Retry-After', Math.ceil(WINDOW_MS / 1000).toString());
    res.status(429).json({ error: 'Too many requests. Please try again later.', retryAfter: Math.ceil(WINDOW_MS / 1000) });
    return;
  }

  next();
}

export function telegramRateLimiter(maxMessages = 30, windowMs = 60000): (chatId: string) => boolean {
  const store2: Record<string, { count: number; firstRequest: number }> = {};
  return (chatId: string): boolean => {
    const now = Date.now();
    const key = String(chatId);
    if (!store2[key]) { store2[key] = { count: 1, firstRequest: now }; return true; }
    if (now - store2[key].firstRequest > windowMs) { store2[key] = { count: 1, firstRequest: now }; return true; }
    if (store2[key].count >= maxMessages) return false;
    store2[key].count++;
    return true;
  };
}

export const tbLimiter = telegramRateLimiter();
