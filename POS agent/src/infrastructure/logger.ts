import winston from 'winston';
import dotenv from 'dotenv';
dotenv.config();

const { combine, timestamp, printf, colorize, json } = winston.format;

const logFormat = printf(({ level, message, timestamp: ts, ...meta }) => {
  const metaStr = Object.keys(meta).length ? ` ${JSON.stringify(meta)}` : '';
  return `[${ts}] ${level}: ${message}${metaStr}`;
});

const logger = winston.createLogger({
  level: process.env.LOG_LEVEL || 'debug',
  format: combine(
    timestamp({ format: 'YYYY-MM-DD HH:mm:ss' }),
    process.env.NODE_ENV === 'production' ? json() : combine(colorize(), logFormat)
  ),
  transports: [
    new winston.transports.Console(),
    new winston.transports.File({ filename: 'logs/error.log', level: 'error', maxsize: 5 * 1024 * 1024, maxFiles: 5 }),
    new winston.transports.File({ filename: 'logs/combined.log', maxsize: 10 * 1024 * 1024, maxFiles: 3 }),
  ],
  exceptionHandlers: [
    new winston.transports.File({ filename: 'logs/exceptions.log' }),
  ],
  rejectionHandlers: [
    new winston.transports.File({ filename: 'logs/rejections.log' }),
  ],
});

export default logger;
