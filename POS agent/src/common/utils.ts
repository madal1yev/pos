import { v4 as uuidv4 } from 'uuid';
import { APP_CONFIG } from '../config/app';

export function generateRequestId(): string {
  return `req_${uuidv4().replace(/-/g, '').slice(0, 16)}`;
}

export function generateId(): string {
  return uuidv4();
}

export function formatCurrency(amount: number, currency = APP_CONFIG.defaultCurrency): string {
  return new Intl.NumberFormat('uz-UZ', { style: 'currency', currency, minimumFractionDigits: 0 }).format(amount);
}

export function formatNumber(num: number): string {
  return new Intl.NumberFormat('uz-UZ').format(num);
}

export function escapeMarkdown(text: string): string {
  return text
    .replace(/([_*\[\]()~`>#+\-=|{}.!])/g, '\\$1')
    .replace(/\n/g, '\\n');
}

export function escapeHtml(text: string): string {
  return text
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;');
}

export function truncate(text: string, maxLen = 100): string {
  if (text.length <= maxLen) return text;
  return text.slice(0, maxLen) + '...';
}

export function parseTime(timeStr: string): Date {
  const [hours, minutes] = timeStr.split(':').map(Number);
  const now = new Date();
  const result = new Date(now);
  result.setHours(hours, minutes, 0, 0);
  if (result <= now) result.setDate(result.getDate() + 1);
  return result;
}

export function delay(ms: number): Promise<void> {
  return new Promise(resolve => setTimeout(resolve, ms));
}

export function chunkArray<T>(arr: T[], chunkSize: number): T[][] {
  const chunks: T[][] = [];
  for (let i = 0; i < arr.length; i += chunkSize) {
    chunks.push(arr.slice(i, i + chunkSize));
  }
  return chunks;
}

export function sanitizeInput(input: string): string {
  return input.trim().slice(0, 500).replace(/[<>"']/g, '');
}

export function generateToken(): string {
  const crypto = require('crypto');
  return crypto.randomBytes(32).toString('hex');
}

export function calculatePercentage(current: number, previous: number): number {
  if (previous === 0) return current > 0 ? 100 : 0;
  return ((current - previous) / previous) * 100;
}

export function clamp(value: number, min: number, max: number): number {
  return Math.max(min, Math.min(max, value));
}
