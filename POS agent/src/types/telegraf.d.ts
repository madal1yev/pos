import { Markup, Extra } from 'telegraf';

export { Markup, Extra };

declare module 'telegraf' {
  interface Context {
    tenantId?: number;
    telegramChatId?: number;
    userId?: number;
    language?: string;
  }
}
