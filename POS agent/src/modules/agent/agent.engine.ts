import { db } from '../../config/database';
import { posDb, posStoreFilter } from '../../config/posdb';
import logger from '../../infrastructure/logger';
import cache from '../../infrastructure/cache';
import { APP_CONFIG } from '../../config/app';
import { sanitizeInput, formatCurrency, formatNumber } from '../../common/utils';
import { toolRegistry } from '../tools/tools.registry';
import { memoryService } from '../memory/memory.service';
import { auditService } from '../audit/audit.service';
import { aiProviderManager } from '../ai/ai.provider';
import { AIMessage } from '../ai/ai.types';

export interface ProcessMessageInput {
  tenantId: number;
  telegramChatId: number;
  message: string;
  language: string;
  userId?: number;
  requestId: string;
  conversationId?: number;
}

export class AgentEngine {
  private agentPrompt: string;

  constructor() {
    this.agentPrompt = this.buildSystemPrompt();
  }

  private buildSystemPrompt(): string {
    return [
      "Siz MaxPOS AI Business Agent siz — biznes egasiga POS tizimidagi REAL ma'lumotlarni ko'rsatadigan yordamchi.",
      '',
      'QOIDALAR:',
      '1. Har qanday savolga javob berishdan oldin mos TOOL ni chaqiring. Hech qachon raqam uydirmang.',
      "2. Ma'lumot kelmasa: «Ma'lumotni olishning imkoni bo'lmadi» deb ayting.",
      '3. Javob qisqa, aniq, raqamlar bilan, biznesga foydali bo\'lsin.',
      '4. Foydalanuvchi tilida javob bering (uz/ru/en).',
      '5. WRITE tool lar avtomatik tasdiq so\'raydi — siz tasdiqlamasdan chaqirmang, foydalanuvchiga tasdiqlash taklif qiling.',
      '',
      'JAVOB FORMATI (Telegram Markdown):',
      'Qisqa sarlavha, asosiy raqamlar, top-5 ro\'yxat, ogohlantirishlar. Ortibcha gap yo\'q.',
    ].join('\n');
  }

  private aiAvailable(): boolean {
    return !!(process.env.OPENAI_API_KEY || APP_CONFIG.openaiApiKey);
  }

  private buildToolDefinitions(): any[] {
    return toolRegistry.getAllTools().map((t) => ({
      type: 'function',
      function: {
        name: t.name,
        description: t.description,
        parameters: {
          type: 'object',
          properties: (t.parameters as any)?.properties || {},
        },
      },
    }));
  }

  async processMessage(input: ProcessMessageInput): Promise<any> {
    const { tenantId, telegramChatId, message, language, userId, requestId, conversationId } = input;

    try {
      await auditService.log({
        tenantId, userId, action: 'agent_message',
        entityType: 'conversation', requestId,
        metadata: { message: message.slice(0, 500) },
      });

      const cleanMessage = sanitizeInput(message);

      // AI kalit bo'lmasa — real ma'lumot bilan qoidaga asoslangan javob
      if (!this.aiAvailable()) {
        const text = await this.ruleBasedReply(tenantId, cleanMessage, language);
        if (text) {
          await this.saveExchange(tenantId, conversationId, cleanMessage, text);
          return { text, toolsUsed: ['rule_based'], memoryUpdated: true, actionTaken: false, confidence: 0.8 };
        }
      }

      const memory = await memoryService.retrieve({ tenantId, query: cleanMessage, limit: 6 });
      const history = await this.getConversationHistory(conversationId || 0, tenantId);
      const fullMessage = this.buildMessage(cleanMessage, memory, history);

      const messages: AIMessage[] = [
        { role: 'system', content: this.agentPrompt },
        { role: 'user', content: fullMessage },
      ];

      const tools = this.buildToolDefinitions();
      const toolsUsed: string[] = [];
      let finalContent = '';
      let iterations = 0;

      while (iterations < 5) {
        iterations++;
        const response = await aiProviderManager.getProvider()!.generateMessage(messages, { tools });
        const toolCalls = response.toolCalls || [];

        if (toolCalls.length === 0) {
          finalContent = response.content || '';
          break;
        }

        messages.push({ role: 'assistant', content: response.content || '', tool_calls: toolCalls });

        for (const tc of toolCalls) {
          const toolName = tc.function.name;
          let toolInput: any = {};
          try { toolInput = JSON.parse(tc.function.arguments || '{}'); } catch { toolInput = {}; }
          toolsUsed.push(toolName);

          let toolResult: any;
          try {
            toolResult = await toolRegistry.execute(toolName, toolInput, tenantId, requestId);
          } catch (err: any) {
            toolResult = { success: false, error: err?.message || String(err) };
          }

          await auditService.log({
            tenantId, userId, action: 'tool_executed', entityType: 'tool',
            toolName, requestId, metadata: { input: toolInput },
          });

          messages.push({ role: 'tool', content: JSON.stringify(toolResult).slice(0, 4000), tool_call_id: tc.id });
        }

        if (iterations >= 5) {
          const last = await aiProviderManager.getProvider()!.generateMessage(messages);
          finalContent = last.content || '';
          break;
        }
      }

      if (!finalContent) {
        finalContent = language === 'ru'
          ? 'K sojaleniyu, ne udalos poluchit dannye.'
          : language === 'en'
            ? 'Sorry, I could not retrieve the data.'
            : "Ma'lumotni olishning imkoni bo'lmadi.";
      }

      await this.saveExchange(tenantId, conversationId, cleanMessage, finalContent);
      return {
        text: finalContent,
        toolsUsed,
        memoryUpdated: true,
        actionTaken: toolsUsed.length > 0,
        confidence: 0.9,
      };
    } catch (err: any) {
      logger.error(`Agent engine error: ${err?.message || err}`, { requestId });
      try {
        const fallback = await this.ruleBasedReply(tenantId, sanitizeInput(message), language);
        if (fallback) return { text: fallback, toolsUsed: ['rule_based'], memoryUpdated: false, actionTaken: false, confidence: 0.7 };
      } catch { /* ignore */ }
      return {
        text: 'Kechirasiz, xatolik yuz berdi. Iltimos, qayta urinib ko\'ring.',
        toolsUsed: [], memoryUpdated: false, actionTaken: false, confidence: 0,
      };
    }
  }

  /** OpenAI kaliti bo'lmaganda ham real ma'lumot qaytaradigan sodda intent router */
  private async ruleBasedReply(tenantId: number, message: string, language: string): Promise<string | null> {
    const m = message.toLowerCase();
    const has = (...words: string[]) => words.some((w) => m.includes(w));

    try {
      if (has('savdo', 'sotuv', 'tushum', 'doxod', 'sales', 'revenue', 'выручка', 'продаж', 'доход', 'kunlik', 'bugun', 'сегодня', 'today')) {
        const s: any = await toolRegistry.execute('get_sales_summary', { period: 'today' }, tenantId, `rule_${Date.now()}`);
        const t = language === 'ru' ? '💰 Продажи сегодня' : language === 'en' ? "💰 Today's sales" : '💰 Bugungi savdo';
        return `${t} 🧾\n━━━━━━━━━━━━━━━\n💵 Tushum: ${formatCurrency(s.total_revenue || 0)}\n🧾 Cheklar: ${formatNumber(s.order_count || 0)} ta\n💳 O‘rtacha chek: ${formatCurrency(s.avg_order || 0)}\n\n🔥 Barakalla! 💪`;
      }
      if (has('kam qolgan', 'tugash', 'ombor', 'sklad', 'ostatok', 'stock', 'inventory', 'zaxira', 'махсулот') || has('qolgan mahsulot')) {
        const rows: any = await toolRegistry.execute('get_low_stock_products', {}, tenantId, `rule_${Date.now()}`);
        if (!rows || rows.length === 0) return '✅ Barcha mahsulotlar zaxirada yetarli! Ombor to‘la 🎉';
        const lines = rows.slice(0, 10).map((r: any) => `${(r.stock_quantity || 0) <= 0 ? '🔴' : '🟡'} ${r.name} — ${r.stock_quantity} ta qoldi!`).join('\n');
        return `⚠️ Kam qolgan mahsulotlar:\n━━━━━━━━━━━━━━━\n${lines}\n\n🛒 Tezda buyurtma bering! 🏃`;
      }
      if (has('top', 'eng ko', 'ko‘p sotilgan', 'ko\'p sotilgan', 'lider', 'лучшие', 'best')) {
        const rows: any = await toolRegistry.execute('get_top_products', { limit: 10 }, tenantId, `rule_${Date.now()}`);
        if (!rows || rows.length === 0) return '😴 Bugun hali savdo qayd etilmagan.';
        const medals = ['🥇', '🥈', '🥉', '4️⃣', '5️⃣', '6️⃣', '7️⃣', '8️⃣', '9️⃣', '🔟'];
        const lines = rows.map((r: any, i: number) => `${medals[i] || '▫️'} ${r.name} — ${r.total_sold} dona 🔥`).join('\n');
        return `🏆 Eng ko‘p sotilganlar (bugun):\n━━━━━━━━━━━━━━━\n${lines}`;
      }
      if (has('buyurtma', 'order', 'заказ', 'chek', 'savdolar ro')) {
        const rows: any = await toolRegistry.execute('get_orders', {}, tenantId, `rule_${Date.now()}`);
        if (!rows || rows.length === 0) return '😴 So‘nggi 7 kunda buyurtma topilmadi.';
        const lines = rows.slice(0, 5).map((r: any) => `🧾 #${r.id} — ${formatCurrency(r.total_amount)} 📅 ${String(r.created_at).slice(0, 16)}`).join('\n');
        return `🛒 So‘nggi buyurtmalar:\n━━━━━━━━━━━━━━━\n${lines}`;
      }
      if (has('mijoz', 'client', 'customer', 'клиент', 'xaridor')) {
        const nameMatch = message.replace(/.*?(mijoz|client|customer|клиент)\s*/i, '').trim();
        if (nameMatch.length >= 2) {
          const s: any = await toolRegistry.execute('get_customer_summary', { name: nameMatch }, tenantId, `rule_${Date.now()}`);
          if (!s || (!s.customer && !(s.order_count > 0))) return `"${nameMatch}" ismli mijoz topilmadi.`;
          return `Mijoz: ${s.customer?.name || nameMatch}\nBuyurtmalar: ${s.order_count || 0} ta\nJami xarid: ${formatCurrency(s.total_spent || 0)}`;
        }
        return 'Qaysi mijozni qidiryapmiz? Ismini yozing. Masalan: "Ali mijoz".';
      }
      if (has('hisobot', 'report', 'отчет', 'otchet', 'analiz', 'tahlil')) {
        const s: any = await toolRegistry.execute('get_sales_summary', { period: 'today' }, tenantId, `rule_${Date.now()}`);
        const low: any = await toolRegistry.execute('get_low_stock_products', {}, tenantId, `rule_${Date.now()}`);
        const top: any = await toolRegistry.execute('get_top_products', { limit: 5 }, tenantId, `rule_${Date.now()}`);
        let text = `📊 Kunlik hisobot 📊\n━━━━━━━━━━━━━━━\n💰 Tushum: ${formatCurrency(s.total_revenue || 0)}\n🧾 Buyurtmalar: ${s.order_count || 0} ta\n`;
        if (top && top.length > 0) text += `\n🔥 TOP: ${top.slice(0, 3).map((r: any) => `${r.name} (${r.total_sold} dona)`).join(', ')}`;
        if (low && low.length > 0) text += `\n\n⚠️ Kam qolgan: ${low.slice(0, 3).map((r: any) => `${r.name} (${r.stock_quantity} ta)`).join(', ')} 🛒`;
        return text;
      }
      if (has('mahsulot', 'product', 'tovar', 'товар', 'nechta mahsulot', 'omborda')) {
        const rows: any = await toolRegistry.execute('get_inventory', {}, tenantId, `rule_${Date.now()}`);
        const total = Array.isArray(rows) ? rows.length : 0;
        const stock = Array.isArray(rows) ? rows.reduce((a: number, r: any) => a + (r.stock_quantity || 0), 0) : 0;
        return `📦 Omborda: 🏷️ ${total} xil mahsulot, 📦 jami ${formatNumber(stock)} dona. ✅`;
      }
    } catch (err: any) {
      logger.error(`Rule-based reply error: ${err?.message || err}`);
      return null;
    }
    return null;
  }

  private async saveExchange(tenantId: number, conversationId: number | undefined, userText: string, assistantText: string): Promise<void> {
    try {
      await memoryService.add({ tenantId, conversationId, type: 'conversation', content: userText.slice(0, 1000), tags: ['user'], importance: 3 });
      await memoryService.add({ tenantId, conversationId, type: 'conversation', content: assistantText.slice(0, 1000), tags: ['assistant'], importance: 3 });
    } catch { /* memory xatosi asosiy oqimni to'xtatmasin */ }
  }

  private async getTenantSettings(tenantId: number): Promise<any> {
    const cached = await cache.get(`tenant:${tenantId}:settings`);
    if (cached) return cached;
    const result = await db.query(`SELECT * FROM business_settings WHERE tenant_id = $1`, [tenantId]);
    const settings = result.rows[0] || {};
    await cache.set(`tenant:${tenantId}:settings`, settings, 900);
    return settings;
  }

  private async getConversationHistory(conversationId: number, tenantId: number): Promise<any[]> {
    try {
      if (!conversationId) return [];
      const result = await db.query(
        `SELECT role, content FROM messages WHERE conversation_id = $1 AND tenant_id = $2 ORDER BY created_at DESC LIMIT $3`,
        [conversationId, tenantId, APP_CONFIG.agentMaxHistoryMessages]
      );
      return result.rows.reverse();
    } catch { return []; }
  }

  private buildMessage(message: string, memory: any[], history: any[]): string {
    let prompt = message;
    if (memory && memory.length > 0) {
      prompt = memory.map((mm: any) => `[xotira]: ${mm.content}`).join('\n') + `\n\nSo'rov: ${message}`;
    }
    if (history && history.length > 0) {
      prompt += '\n\nTarix:\n' + history.map((h: any) => `${h.role}: ${h.content}`).join('\n');
    }
    return prompt;
  }

  // ---- Telegram tugmalar uchun to'g'ridan-to'g'ri handlerlar (real POS ma'lumot) ----

  async generateReport(ctx: any): Promise<void> {
    try {
      const sales = await posDb.query(`
        SELECT COUNT(*) as cnt, COALESCE(SUM(total_amount), 0) as revenue,
          COALESCE(AVG(total_amount), 0) as avg_order
        FROM sales WHERE DATE(created_at) = DATE('now')${posStoreFilter('sales')}
      `);
      const low = await posDb.query(`
        SELECT name, stock_quantity FROM products
        WHERE stock_quantity <= minimum_stock${posStoreFilter('products')}
        ORDER BY stock_quantity ASC LIMIT 5
      `);
      const top = await posDb.query(`
        SELECT p.name, SUM(si.quantity) as sold FROM sale_items si
        JOIN products p ON si.product_id = p.id JOIN sales s ON s.id = si.sale_id
        WHERE DATE(s.created_at) = DATE('now')${posStoreFilter('sales', 's')}
        GROUP BY p.id ORDER BY sold DESC LIMIT 5
      `);
      const row = sales.rows[0] || {};
      const esc = (s: any) => String(s ?? '').replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');
      const medals = ['🥇', '🥈', '🥉', '4️⃣', '5️⃣'];
      const topLines = top.rows.slice(0, 5).map((r: any, i: number) => `   ${medals[i] || '▫️'} ${esc(r.name)} — <b>${r.sold} dona</b>`).join('\n');
      const lowLines = low.rows.map((r: any) => `   ${(r.stock_quantity || 0) <= 0 ? '🔴' : '🟡'} ${esc(r.name)} — <b>${r.stock_quantity} ta</b>`).join('\n');
      const text =
        `📊 <b>BUGUNGI HISOBOT</b> 📊\n━━━━━━━━━━━━━━━\n` +
        `💰 Tushum: <b>${esc(formatCurrency(row.revenue || 0))}</b>\n` +
        `🧾 Buyurtmalar: <b>${row.cnt || 0} ta</b>\n💳 O‘rtacha chek: <b>${esc(formatCurrency(row.avg_order || 0))}</b>\n\n` +
        `⚠️ <b>Kam qolgan:</b>\n${lowLines || `✅ <i>Hammasi joyida!</i>`}\n\n` +
        `🔥 <b>TOP mahsulotlar:</b>\n${topLines || `<i>Hali savdo yo‘q 😴</i>`}`;
      await ctx.reply(text, { parse_mode: 'HTML' } as any);
    } catch {
      await ctx.reply('Hisobot yaratishda xatolik yuz berdi.');
    }
  }

  async handleSales(ctx: any): Promise<void> {
    try {
      const today = await posDb.query(`
        SELECT COUNT(*) as cnt, COALESCE(SUM(total_amount), 0) as revenue
        FROM sales WHERE DATE(created_at) = DATE('now')${posStoreFilter('sales')}
      `);
      const yest = await posDb.query(`
        SELECT COALESCE(SUM(total_amount), 0) as revenue
        FROM sales WHERE DATE(created_at) = DATE('now', '-1 day')${posStoreFilter('sales')}
      `);
      const row = today.rows[0] || {};
      const prev = yest.rows[0]?.revenue || 0;
      const pct = prev > 0 ? (((row.revenue || 0) - prev) / prev * 100).toFixed(1) : '0.0';
      const trend = Number(pct) >= 0 ? `📈 +${pct}%` : `📉 ${pct}%`;
      await ctx.reply(
        `💰 <b>BUGUNGI SAVDO</b> 🧾\n━━━━━━━━━━━━━━━\n` +
        `💵 Tushum: <b>${formatCurrency(row.revenue || 0)}</b>\n` +
        `🧾 Cheklar: <b>${row.cnt || 0} ta</b>\n` +
        `${trend} <i>kechaga nisbatan</i>\n\n` +
        `${(row.cnt || 0) === 0 ? '😴 <i>Hali savdo yo‘q — birinchisini kutyapmiz!</i> 🍀' : '🔥 <i>Barakalla! Shunday davom eting!</i> 💪'}`,
        { parse_mode: 'HTML' } as any
      );
    } catch {
      await ctx.reply('Savdo ma\'lumotlarini olishda xatolik.');
    }
  }

  async handleInventory(ctx: any): Promise<void> {
    try {
      const low = await posDb.query(`
        SELECT name, stock_quantity, minimum_stock FROM products
        WHERE stock_quantity <= minimum_stock${posStoreFilter('products')}
        ORDER BY stock_quantity ASC LIMIT 10
      `);
      const total = await posDb.query(`
        SELECT COUNT(*) as cnt, COALESCE(SUM(stock_quantity), 0) as stock
        FROM products WHERE 1=1${posStoreFilter('products')}
      `);
      const t = total.rows[0] || {};
      const esc = (s: any) => String(s ?? '').replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');
      if (low.rows.length === 0) {
        await ctx.reply(`📦 <b>OMBOR</b> ✅\n━━━━━━━━━━━━━━━\n🏷️ <b>${t.cnt || 0} xil</b> mahsulot • 📦 Jami <b>${formatNumber(t.stock || 0)} dona</b>\n\n✅ <i>Kam qolgan mahsulot yo‘q — ombor to‘la!</i> 🎉`, { parse_mode: 'HTML' } as any);
        return;
      }
      await ctx.reply(
        `📦 <b>OMBOR</b>\n━━━━━━━━━━━━━━━\n🏷️ <b>${t.cnt || 0} xil</b> • 📦 Jami <b>${formatNumber(t.stock || 0)} dona</b>\n\n⚠️ <b>Kam qolganlar:</b>\n` +
        low.rows.map((r: any) => `   ${(r.stock_quantity || 0) <= 0 ? '🔴' : '🟡'} ${esc(r.name)} — <b>${r.stock_quantity} ta</b>`).join('\n'),
        { parse_mode: 'HTML' } as any
      );
    } catch {
      await ctx.reply('Ombor ma\'lumotlarini olishda xatolik.');
    }
  }

  async handleOrders(ctx: any): Promise<void> {
    try {
      const orders = await posDb.query(`
        SELECT id, customer_name, total_amount, payment_method, created_at FROM sales
        WHERE DATE(created_at) >= DATE('now', '-7 days')${posStoreFilter('sales')}
        ORDER BY created_at DESC LIMIT 5
      `);
      if (orders.rows.length === 0) {
        await ctx.reply('🛒 <i>So‘nggi 7 kunda buyurtma topilmadi 😴</i>');
        return;
      }
      await ctx.reply(
        `🛒 <b>SO‘NGGI BUYURTMALAR</b> 🧾\n━━━━━━━━━━━━━━━\n` +
        orders.rows.map((r: any, i: number) => `${['1️⃣', '2️⃣', '3️⃣', '4️⃣', '5️⃣'][i] || '▫️'} <b>#${r.id}</b> — ${formatCurrency(r.total_amount)} 📅 <i>${String(r.created_at).slice(0, 16)}</i>`).join('\n'),
        { parse_mode: 'HTML' } as any
      );
    } catch {
      await ctx.reply('Buyurtma ma\'lumotlarini olishda xatolik.');
    }
  }

  async handleCustomers(ctx: any): Promise<void> {
    try {
      const customers = await posDb.query(`
        SELECT customer_name as name, COUNT(*) as cnt, COALESCE(SUM(total_amount), 0) as total
        FROM sales WHERE customer_name IS NOT NULL AND customer_name != ''${posStoreFilter('sales')}
        GROUP BY customer_name ORDER BY total DESC LIMIT 5
      `);
      if (customers.rows.length === 0) {
        await ctx.reply('👥 <i>Mijozlar bo‘yicha ma’lumot topilmadi 😴</i>');
        return;
      }
      await ctx.reply(
        `👥 <b>ENG FAOL MIJOZLAR</b> 🌟\n━━━━━━━━━━━━━━━\n` +
        customers.rows.map((r: any, i: number) => `${['🥇', '🥈', '🥉', '4️⃣', '5️⃣'][i] || '▫️'} <b>${String(r.name ?? '').replace(/&/g, '&amp;').replace(/</g, '&lt;')}</b>\n      🧾 ${r.cnt} ta • 💰 ${formatCurrency(r.total)}`).join('\n'),
        { parse_mode: 'HTML' } as any
      );
    } catch {
      await ctx.reply('Mijoz ma\'lumotlarini olishda xatolik.');
    }
  }

  async handleAutomation(ctx: any): Promise<void> {
    try {
      const tenantId = ctx.tenantId || 1;
      const automations = await db.query(
        `SELECT id, name, trigger_type, is_active FROM automations WHERE tenant_id = $1 ORDER BY created_at DESC`, [tenantId]
      );
      if (automations.rows.length === 0) {
        await ctx.reply('Hali avtomatlashtirish qoidalari yo\'q.');
        return;
      }
      await ctx.reply(
        `Avtomatlashtirish qoidalari:\n\n` +
        automations.rows.map((r: any) => `${r.is_active ? '[ON]' : '[OFF]'} ${r.name} (${r.trigger_type})`).join('\n')
      );
    } catch {
      await ctx.reply('Avtomatlashtirish ma\'lumotlarini olishda xatolik.');
    }
  }

  async handleSettings(ctx: any): Promise<void> {
    try {
      const tenantId = ctx.tenantId || 1;
      const settings = await db.query(`SELECT * FROM business_settings WHERE tenant_id = $1`, [tenantId]);
      const s = settings.rows[0] || {};
      const text = 'Sozlamalar:\n\nValyuta: ' + (s.currency || 'UZS')
        + '\nSoat zonasi: ' + (s.timezone || 'Asia/Tashkent')
        + '\nTil: ' + (s.language || 'uz');
      await ctx.reply(text);
    } catch {
      await ctx.reply('Sozlamalarni olishda xatolik.');
    }
  }
}

export const agentEngine = new AgentEngine();
