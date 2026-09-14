import { Telegraf } from 'telegraf';
import dotenv from 'dotenv';
dotenv.config();
import { APP_CONFIG } from './app';
import logger from '../infrastructure/logger';
import { Markup } from 'telegraf';

export interface TelegramBot {
  bot: Telegraf;
  botToken: string;
}

export function getMainMenuKeyboard(): any {
  return Markup.inlineKeyboard([
    [Markup.button.callback('📊 Savdo', 'menu_sales')],
    [Markup.button.callback('📦 Ombor', 'menu_inventory')],
    [Markup.button.callback('🛒 Buyurtmalar', 'menu_orders')],
    [Markup.button.callback('👥 Mijozlar', 'menu_customers')],
    [Markup.button.callback('📈 Hisobotlar', 'menu_reports')],
    [Markup.button.callback('⚙️ Sozlamalar', 'menu_settings')],
    [Markup.button.callback('🤖 Agent', 'menu_agent')],
    [Markup.button.callback('📋 Avtomatlashtirish', 'menu_automation')],
  ]);
}

export function getHelpKeyboard(): any {
  return Markup.inlineKeyboard([
    [Markup.button.callback('📊 Savdo', 'help_sales')],
    [Markup.button.callback('📦 Ombor', 'help_inventory')],
    [Markup.button.callback('🛒 Buyurtmalar', 'help_orders')],
    [Markup.button.callback('👥 Mijozlar', 'help_customers')],
    [Markup.button.callback('🔙 Orqaga', 'menu_main')],
  ]);
}

export function getBackKeyboard(): any {
  return Markup.inlineKeyboard([[Markup.button.callback('🔙 Orqaga', 'menu_main')]]);
}

export function getConfirmKeyboard(): any {
  return Markup.inlineKeyboard([
    [Markup.button.callback('✅ Tasdiqlash', 'confirm_yes')],
    [Markup.button.callback('❌ Bekor qilish', 'confirm_no')],
  ]);
}

export function getPaginationKeyboard(currentPage: number, totalPages: number, action: string): any {
  const buttons: any[][] = [];
  if (currentPage > 1) buttons.push([Markup.button.callback('⬅️ Oldin', `${action}_page_${currentPage - 1}`)]);
  if (currentPage < totalPages) buttons.push([Markup.button.callback('Keyingi ➡️', `${action}_page_${currentPage + 1}`)]);
  if (currentPage > 1 && currentPage < totalPages) buttons.push([Markup.button.callback('⬅️ Oldin', `${action}_page_${currentPage - 1}`), Markup.button.callback('Keyingi ➡️', `${action}_page_${currentPage + 1}`)]);
  return Markup.inlineKeyboard(buttons);
}

export function createBot(): TelegramBot {
  const bot = new Telegraf(APP_CONFIG.botToken);
  logger.info('🤖 Telegram bot created');
  return { bot, botToken: APP_CONFIG.botToken };
}
