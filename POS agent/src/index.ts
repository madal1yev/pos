import './config/database';
import './config/redis';
import logger from './infrastructure/logger';
import { bootstrapDatabase } from './database/bootstrap';
import { automationEngine } from './modules/automation/automation.engine';
import { notificationWorker } from './modules/workers/notification.worker';
import { posAdapter } from './modules/pos/pos.adapter';
import { aiProviderManager } from './modules/ai/ai.provider';
import { agentEngine } from './modules/agent/agent.engine';
import { APP_CONFIG } from './config/app';
import { initWebhookListener, registerRoutes } from './modules/pos/pos.webhook';
import { createBot } from './config/telegram';
import { telegramHandler } from './modules/telegram/telegram.handler';
import app from './server';

let bot: any;

async function main(): Promise<void> {
  logger.info('POS AI Agent Platform Starting...');

  // Agent DB: jadvallar + default tenant + owner bog'lanishi
  await bootstrapDatabase();

  const health = await posAdapter.healthCheck();
  logger.info(`POS Adapter: ${health ? 'Connected' : 'Disconnected'}`);

  const aiHealth = await aiProviderManager.healthCheck();
  logger.info(`AI Providers: ${JSON.stringify(aiHealth)}`);

  // Telegram bot — barcha xabarlar bitta handler orqali
  if (!APP_CONFIG.botToken) {
    logger.error('BOT_TOKEN topilmadi! .env faylni tekshiring.');
  } else {
    try {
      const created = createBot();
      bot = created.bot;
      telegramHandler.setAgentService(agentEngine);

      bot.on('message', async (ctx: any) => {
        try {
          await telegramHandler.handleMessage(ctx);
        } catch (err: any) {
          logger.error(`Message handler error: ${err?.message || err}`);
          try { await ctx.reply("Kechirasiz, xatolik yuz berdi."); } catch { /* ignore */ }
        }
      });

      bot.on('callback_query', async (ctx: any) => {
        try {
          const data = ctx.callbackQuery?.data;
          try {
            if (typeof ctx.answerCbQuery === 'function') await ctx.answerCbQuery();
          } catch { /* ignore */ }
          if (!data) return;
          switch (data) {
            case 'menu_sales': await telegramHandler.handleSales(ctx); break;
            case 'menu_inventory': await telegramHandler.handleInventory(ctx); break;
            case 'menu_orders': await telegramHandler.handleOrders(ctx); break;
            case 'menu_customers': await telegramHandler.handleCustomers(ctx); break;
            case 'menu_reports': await telegramHandler.handleReport(ctx); break;
            case 'menu_settings': await telegramHandler.handleSettings(ctx); break;
            case 'menu_agent': await ctx.reply('AI Agent bilan gaplashish uchun shunchaki yozing.'); break;
            case 'menu_automation': await telegramHandler.handleAutomation(ctx); break;
            case 'menu_main': await telegramHandler.handleStart(ctx); break;
            case 'confirm_yes': await ctx.reply('Amal tasdiqlandi!'); break;
            case 'confirm_no': await ctx.reply('Bekor qilindi.'); break;
            default: await telegramHandler.handleStart(ctx); break;
          }
        } catch (err: any) {
          logger.error(`Callback error: ${err?.message || err}`);
        }
      });

      // launch() ni kutmasdan ishga tushiramiz (polling fonda davom etadi)
      bot.launch()
        .then(() => logger.info('Telegram bot launched (long polling)'))
        .catch((err: any) => logger.error(`Telegram launch failed: ${err?.message || err}`));
      logger.info(`Owner chat: ${APP_CONFIG.ownerChatId}`);

      bot.telegram.getMe()
        .then((me: any) => logger.info(`Bot: @${me.username} (id ${me.id})`))
        .catch(() => undefined);

      // Telegram pastki "/" menyusi — buyruqlar ro'yxati
      bot.telegram.setMyCommands([
        { command: 'start', description: 'Boshlash' },
        { command: 'menu', description: 'Tugmalar menyusi' },
        { command: 'sales', description: 'Bugungi savdo' },
        { command: 'inventory', description: 'Ombor holati' },
        { command: 'orders', description: "So'nggi buyurtmalar" },
        { command: 'customers', description: 'Mijozlar' },
        { command: 'report', description: 'Kunlik hisobot' },
        { command: 'automation', description: 'Avtomatlashtirish' },
        { command: 'status', description: 'Tizim holati' },
        { command: 'help', description: 'Yordam' },
      ]).catch(() => undefined);
    } catch (err: any) {
      logger.error(`Telegram bot error: ${err?.message || err}`);
    }
  }

  // Fon ishchilari
  automationEngine.start().catch((err) => logger.error(`Automation error: ${err?.message || err}`));
  notificationWorker.start().catch((err) => logger.error(`Notification worker error: ${err?.message || err}`));
  initWebhookListener();

  const posRoutes = registerRoutes();
  app.use('/api/pos', posRoutes);

  logger.info('POS AI Agent Platform Ready');
  logger.info(`Dashboard: http://localhost:${APP_CONFIG.port}`);
  logger.info(`Health: http://localhost:${APP_CONFIG.port}/api/health`);
  logger.info(`Soatlik hisobotlar: chat ${APP_CONFIG.ownerChatId}`);
}

main().catch((err) => {
  logger.error(`Startup failed: ${err?.message || err}`);
  process.exit(1);
});

process.on('SIGTERM', () => { try { bot?.stop(); } catch { /* ignore */ } process.exit(0); });
process.on('SIGINT', () => { try { bot?.stop(); } catch { /* ignore */ } process.exit(0); });

export { agentEngine };
export default app;
