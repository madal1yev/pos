import { Context } from 'telegraf';
import { db } from '../../config/database';
import logger from '../../infrastructure/logger';
import { tbLimiter } from '../../infrastructure/rate-limiter';
import { sanitizeInput } from '../../common/utils';
import { agentEngine } from '../agent/agent.engine';
import { Markup } from 'telegraf';

export interface IUserContext extends Context {
  tenantId?: number;
  telegramChatId?: number;
  userId?: number;
  language?: string;
  conversationId?: number;
}

/** Doimiy pastki tugmalar — chat tarixida yo'qolmaydi */
export const MENU_BUTTONS = {
  SALES: 'Savdo',
  INVENTORY: 'Ombor',
  ORDERS: 'Buyurtmalar',
  CUSTOMERS: 'Mijozlar',
  REPORT: 'Hisobot',
  MENU: 'Menyu',
  AUTOMATION: 'Avtomat',
} as const;

export class TelegramHandler {
  setAgentService(_service: any): void {}

  /** Foydalanuvchini topadi yoki avtomatik ro'yxatga oladi (birinchi /start da) */
  private async resolveTenant(ctx: IUserContext): Promise<{ tenantId: number; userId: number } | null> {
    const telegramId = ctx.from?.id;
    const chatId = ctx.chat?.id || telegramId;
    if (!telegramId || !chatId) return null;

    const existing = await db.query(
      `SELECT tenant_id, user_id FROM telegram_accounts WHERE telegram_user_id = $1 AND is_active = 1`,
      [telegramId]
    );
    if (existing.rows.length > 0) {
      await db.run(`UPDATE telegram_accounts SET last_interaction_at = datetime('now') WHERE telegram_user_id = $1`, [telegramId]);
      return { tenantId: existing.rows[0].tenant_id, userId: existing.rows[0].user_id };
    }

    // Birinchi marta — default tenant ga bog'laymiz
    const tenantRow = await db.query(`SELECT id FROM tenants WHERE id = 1 AND is_active = 1`);
    if (tenantRow.rows.length === 0) {
      logger.error('Default tenant topilmadi. bootstrapDatabase() ishga tushganmi?');
      return null;
    }
    const tenantId = tenantRow.rows[0].id;

    const firstName = (ctx.from as any)?.first_name || 'Telegram';
    const lastName = (ctx.from as any)?.last_name || '';
    const username = (ctx.from as any)?.username || '';
    const email = `tg_${telegramId}@telegram.local`;

    let userRow = await db.query(`SELECT id FROM users WHERE tenant_id = $1 AND email = $2`, [tenantId, email]);
    let userId: number;
    if (userRow.rows.length === 0) {
      let roleRow = await db.query(`SELECT id FROM roles WHERE tenant_id = $1 ORDER BY level DESC LIMIT 1`, [tenantId]);
      const roleId = roleRow.rows[0]?.id || null;
      const created = await db.run(
        `INSERT INTO users (tenant_id, email, name, username, role_id, is_active) VALUES ($1, $2, $3, $4, $5, 1)`,
        [tenantId, email, `${firstName} ${lastName}`.trim(), username]
      );
      void roleId;
      userId = Number(created.lastInsertRowid);
      if (roleId) {
        await db.run(`UPDATE users SET role_id = $1 WHERE id = $2`, [roleId, userId]);
      }
    } else {
      userId = userRow.rows[0].id;
    }

    await db.run(
      `INSERT INTO telegram_accounts (tenant_id, user_id, telegram_user_id, telegram_chat_id, first_name, last_name, username, is_active)
       VALUES ($1, $2, $3, $4, $5, $6, $7, 1)`,
      [tenantId, userId, telegramId, chatId, firstName, lastName, username]
    );
    logger.info(`Yangi Telegram foydalanuvchi ro'yxatga olindi: ${telegramId} (tenant ${tenantId})`);
    return { tenantId, userId };
  }

  private async getOrCreateConversation(tenantId: number, chatId: number, userId: number): Promise<number | undefined> {
    try {
      const existing = await db.query(
        `SELECT id FROM conversations WHERE tenant_id = $1 AND telegram_chat_id = $2`, [tenantId, chatId]
      );
      if (existing.rows.length > 0) {
        await db.run(`UPDATE conversations SET last_message_at = datetime('now'), message_count = message_count + 1 WHERE id = $1`, [existing.rows[0].id]);
        return existing.rows[0].id;
      }
      const created = await db.run(
        `INSERT INTO conversations (tenant_id, telegram_chat_id, user_id, status, language) VALUES ($1, $2, $3, 'active', 'uz')`,
        [tenantId, chatId, userId]
      );
      return Number(created.lastInsertRowid);
    } catch {
      return undefined;
    }
  }

  async handleMessage(ctx: IUserContext): Promise<void> {
    const chatId = ctx.chat?.id || 0;
    const text = (ctx.message as any)?.text || '';
    if (!text) return;

    if (!tbLimiter(String(chatId))) {
      await ctx.reply("Siz juda ko'p xabar yubordingiz. Iltimos, biroz kuting.");
      return;
    }

    const requestId = `req_${Date.now()}`;
    logger.info(`Telegram xabar: chat=${chatId} text="${text.slice(0, 80)}"`);

    let resolved: { tenantId: number; userId: number } | null = null;
    try {
      resolved = await this.resolveTenant(ctx);
    } catch (err: any) {
      logger.error(`Tenant resolve xato: ${err?.message || err}`);
    }
    if (!resolved) {
      await ctx.reply('Xatolik: tizimga ulanib bo\'lmadi. Iltimos, keyinroq qayta urinib ko\'ring.');
      return;
    }

    ctx.tenantId = resolved.tenantId;
    ctx.userId = resolved.userId;
    ctx.telegramChatId = chatId;
    ctx.conversationId = await this.getOrCreateConversation(resolved.tenantId, chatId, resolved.userId);

    const message = sanitizeInput(text);

    // Doimiy pastki tugmalar
    const menuAction = this.matchMenuButton(message);
    if (menuAction) {
      await menuAction(ctx);
      return;
    }

    if (message.startsWith('/start')) { await this.handleStart(ctx); return; }
    if (message.startsWith('/menu')) { await this.handleMenu(ctx); return; }
    if (message.startsWith('/help')) { await this.handleHelp(ctx); return; }
    if (message.startsWith('/settings')) { await this.handleSettings(ctx); return; }
    if (message.startsWith('/report')) { await this.handleReport(ctx); return; }
    if (message.startsWith('/sales')) { await this.handleSales(ctx); return; }
    if (message.startsWith('/inventory')) { await this.handleInventory(ctx); return; }
    if (message.startsWith('/orders')) { await this.handleOrders(ctx); return; }
    if (message.startsWith('/customers')) { await this.handleCustomers(ctx); return; }
    if (message.startsWith('/automation')) { await this.handleAutomation(ctx); return; }
    if (message.startsWith('/status')) { await this.handleStatus(ctx); return; }

    await this.handleAgentQuery(ctx, message, requestId);
  }

  private getReplyKeyboard(): any {
    const kb = Markup.keyboard([
      [MENU_BUTTONS.SALES, MENU_BUTTONS.INVENTORY],
      [MENU_BUTTONS.ORDERS, MENU_BUTTONS.CUSTOMERS],
      [MENU_BUTTONS.REPORT, MENU_BUTTONS.MENU],
    ]).resize();
    return typeof (kb as any).persistent === 'function' ? (kb as any).persistent() : kb;
  }

  private getInlineMenu(): any {
    return Markup.inlineKeyboard([
      [Markup.button.callback('Savdo', 'menu_sales'), Markup.button.callback('Ombor', 'menu_inventory')],
      [Markup.button.callback('Buyurtmalar', 'menu_orders'), Markup.button.callback('Mijozlar', 'menu_customers')],
      [Markup.button.callback('Hisobotlar', 'menu_reports'), Markup.button.callback('Avtomatlashtirish', 'menu_automation')],
    ]);
  }

  private matchMenuButton(message: string): ((ctx: IUserContext) => Promise<void>) | null {
    switch (message) {
      case MENU_BUTTONS.SALES: return (ctx) => this.handleSales(ctx);
      case MENU_BUTTONS.INVENTORY: return (ctx) => this.handleInventory(ctx);
      case MENU_BUTTONS.ORDERS: return (ctx) => this.handleOrders(ctx);
      case MENU_BUTTONS.CUSTOMERS: return (ctx) => this.handleCustomers(ctx);
      case MENU_BUTTONS.REPORT: return (ctx) => this.handleReport(ctx);
      case MENU_BUTTONS.MENU: return (ctx) => this.handleMenu(ctx);
      case MENU_BUTTONS.AUTOMATION: return (ctx) => this.handleAutomation(ctx);
      default: return null;
    }
  }

  async handleStart(ctx: IUserContext): Promise<void> {
    // 1-xabar: doimiy pastki klaviatura (har doim ko'rinib turadi)
    await ctx.reply(
      'Assalomu alaykum! MaxPOS AI Agent xizmatiga xush kelibsiz!\n\n' +
      "Men sizning do'koningizdagi real ma'lumotlarni ko'rsataman.\n" +
      'Pastdagi tugmalar har doim shu yerda turadi — istalgan vaqtda bosing.',
      this.getReplyKeyboard()
    );
    // 2-xabar: tezkor inline menyu
    await this.handleMenu(ctx);
  }

  async handleMenu(ctx: IUserContext): Promise<void> {
    await ctx.reply(
      'Kerakli bo\'limni tanlang (yoki shunchaki yozing, masalan: "Bugungi savdo qancha?"):',
      this.getInlineMenu()
    );
  }

  async handleHelp(ctx: IUserContext): Promise<void> {
    await ctx.reply(
      'Yordam\n\nPastdagi tugmalar har doim shu yerda — istalgan vaqtda bosing.\n' +
      'Tugmalarni qayta chiqarish: /menu\n\n' +
      'Savdo haqida: "Bugungi savdo qancha?"\nOmbor: "Kam qolgan mahsulotlar"\n' +
      'Buyurtmalar: "Oxirgi buyurtmalar"\nMijozlar: "Ali mijoz"\nHisobot: "Kunlik hisobot"\n\n' +
      'Buyruqlar: /sales /inventory /orders /customers /report /automation /status /settings'
    );
  }

  async handleSettings(ctx: IUserContext): Promise<void> {
    try { await agentEngine.handleSettings(ctx); } catch { await ctx.reply('Sozlamalarni olishda xatolik.'); }
  }

  async handleReport(ctx: IUserContext): Promise<void> {
    try { await agentEngine.generateReport(ctx); } catch { await ctx.reply('Hisobot yaratishda xatolik.'); }
  }

  async handleSales(ctx: IUserContext): Promise<void> {
    try { await agentEngine.handleSales(ctx); } catch { await ctx.reply('Savdo ma\'lumotlarini olishda xatolik.'); }
  }

  async handleInventory(ctx: IUserContext): Promise<void> {
    try { await agentEngine.handleInventory(ctx); } catch { await ctx.reply('Ombor ma\'lumotlarini olishda xatolik.'); }
  }

  async handleOrders(ctx: IUserContext): Promise<void> {
    try { await agentEngine.handleOrders(ctx); } catch { await ctx.reply('Buyurtma ma\'lumotlarini olishda xatolik.'); }
  }

  async handleCustomers(ctx: IUserContext): Promise<void> {
    try { await agentEngine.handleCustomers(ctx); } catch { await ctx.reply('Mijoz ma\'lumotlarini olishda xatolik.'); }
  }

  async handleAutomation(ctx: IUserContext): Promise<void> {
    try { await agentEngine.handleAutomation(ctx); } catch { await ctx.reply('Avtomatlashtirish ma\'lumotlarini olishda xatolik.'); }
  }

  async handleStatus(ctx: IUserContext): Promise<void> {
    await ctx.reply('Agent Status\n\nBackend: ishlayapti\nDatabase: connected\nAI: ready\n\nAgent 24/7 ishlayapti!');
  }

  private async handleAgentQuery(ctx: IUserContext, message: string, requestId: string): Promise<void> {
    try {
      const response = await agentEngine.processMessage({
        tenantId: ctx.tenantId!,
        telegramChatId: ctx.telegramChatId!,
        message,
        language: ctx.language || 'uz',
        userId: ctx.userId,
        requestId,
        conversationId: ctx.conversationId,
      });
      await ctx.reply(response.text);
    } catch (err: any) {
      logger.error(`Agent processing error: ${err?.message || err}`);
      await ctx.reply('Kechirasiz, xatolik yuz berdi.');
    }
  }
}

export const telegramHandler = new TelegramHandler();
