import logger from './logger';
import { APP_CONFIG } from '../config/app';

export class AppError extends Error {
  public statusCode: number;
  public isOperational: boolean;
  public requestId: string;

  constructor(message: string, statusCode = 500, isOperational = true) {
    super(message);
    this.statusCode = statusCode;
    this.isOperational = isOperational;
    this.requestId = generateRequestId();
  }
}

function generateRequestId(): string {
  const crypto = require('crypto');
  return `req_${crypto.randomBytes(16).toString('hex')}`;
}

export function handleError(err: any, req?: any): any {
  const requestId = err.requestId || generateRequestId();
  const isDev = APP_CONFIG.nodeEnv !== 'production';

  logger.error({
    message: err.message,
    stack: isDev ? err.stack : undefined,
    requestId,
    path: req?.path,
    method: req?.method,
    ip: req?.ip,
    name: err.name,
    statusCode: err.statusCode,
  });

  if (err instanceof AppError) {
    return {
      error: err.message,
      requestId,
      ...(isDev && { stack: err.stack }),
    };
  }

  return {
    error: 'Internal server error',
    requestId,
    ...(isDev && { stack: err.stack }),
  };
}

export function asyncHandler(fn: Function) {
  return (req: any, res: any, next: any) => {
    Promise.resolve(fn(req, res, next)).catch(next);
  };
}

export function errorHandler(err: any, req: any, res: any, _next: any): void {
  const body = handleError(err, req);
  const status = err?.statusCode || 500;
  res.status(status).json(body);
}

export class RetryError extends Error {
  public retries: number;
  public lastError: Error;

  constructor(message: string, retries: number, lastError: Error) {
    super(message);
    this.retries = retries;
    this.lastError = lastError;
  }
}

export async function withRetry<T>(
  fn: () => Promise<T>,
  maxAttempts: number,
  delayMs: number,
  context = ''
): Promise<T> {
  let lastError: Error | null = null;

  for (let i = 0; i < maxAttempts; i++) {
    try {
      return await fn();
    } catch (err: any) {
      lastError = err;
      logger.warn(`Retry ${i + 1}/${maxAttempts} failed for ${context}: ${err.message}`);
      if (i < maxAttempts - 1) {
        await new Promise(resolve => setTimeout(resolve, delayMs * Math.pow(2, i)));
      }
    }
  }

  throw new RetryError(
    `All ${maxAttempts} retries failed for ${context}: ${lastError?.message}`,
    maxAttempts,
    lastError || new Error('Unknown error')
  );
}
