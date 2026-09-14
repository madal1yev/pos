import { Telegraf } from 'telegraf';
import { db } from '../../config/database';
import { posDb, posStoreFilter } from '../../config/posdb';
import logger from '../../infrastructure/logger';
import { notificationsService } from '../notifications/notifications.service';
import { reportsService } from '../reports/reports.service';
import { APP_CONFIG } from '../../config/app';
import { formatCurrency, formatNumber } from '../../common/utils';
import { formatHourlyHTML, formatDailyHTML } from '../../common/report-format';
import { withRetry } from '../../infrastructure/error-handler';

interface NotificationState {
  lastHourlySent: number;
  lastDailySent: string;
  lastEventNotifications: Record<string, number>;
  productCount: number;
  inventorySnapshot: Record<string, number>;
  saleCount: number;
}

export class NotificationWorker {
  private state: NotificationState = {
    lastHourlySent: 0,
    lastDailySent: '',
    lastEventNotifications: {},
    productCount: 0,
    inventorySnapshot: {},
    saleCount: 0,
  };
  private ownerChatId: number;
  private isRunning: boolean = false;
  private interval: NodeJS.Timeout | null = null;
  private cooldownMs: number;

  constructor() {
    this.ownerChatId = APP_CONFIG.ownerChatId;
    this.cooldownMs = APP_CONFIG.notificationCooldownMinutes * 60 * 1000;
  }

  async start(): Promise<void> {
    if (this.isRunning) return;
    this.isRunning = true;
    logger.info(`Notification Worker started, chat: ${this.ownerChatId}`);

    await this.loadLastHourlySent();
    await this.initializeState();
    this.interval = setInterval(() => this.checkAndSend(), APP_CONFIG.schedulerIntervalMs);
    await this.checkAndSend();
  }

  stop(): void {
    this.isRunning = false;
    if (this.interval) {
      clearInterval(this.interval);
      this.interval = null;
    }
    logger.info('Notification Worker stopped');
  }

  private async loadLastHourlySent(): Promise<void> {
    try {
      const row = await db.query(`SELECT value FROM worker_state WHERE key = 'last_hourly_sent'`);
      const ts = parseInt(row.rows[0]?.value || '0', 10);
      if (Number.isFinite(ts) && ts > 0) this.state.lastHourlySent = ts;
    } catch { /* birinchi ishga tushish */ }
    try {
      const row = await db.query(`SELECT value FROM worker_state WHERE key = 'last_daily_sent'`);
      if (row.rows[0]?.value) this.state.lastDailySent = row.rows[0].value;
    } catch { /* birinchi ishga tushish */ }
  }

  private async saveLastHourlySent(ts: number): Promise<void> {
    try {
      this.state.lastHourlySent = ts;
      await db.run(
        `INSERT INTO worker_state (key, value, updated_at) VALUES ('last_hourly_sent', $1, datetime('now'))
         ON CONFLICT(key) DO UPDATE SET value = $1, updated_at = datetime('now')`,
        [String(ts)]
      );
    } catch { /* ignore */ }
  }

  private async initializeState(): Promise<void> {
    try {
      if (!posDb.isAvailable) {
        logger.warn(`POS DB topilmadi: ${posDb.dbPath}`);
        return;
      }
      const products = await posDb.query(`SELECT COUNT(*) as cnt FROM products WHERE 1=1${posStoreFilter('products')}`);
      this.state.productCount = products.rows[0]?.cnt || 0;
      const inventory = await posDb.query(`SELECT name, stock_quantity FROM products WHERE 1=1${posStoreFilter('products')}`);
      for (const p of inventory.rows) {
        this.state.inventorySnapshot[p.name] = p.stock_quantity;
      }
      const sales = await posDb.query(`SELECT COUNT(*) as cnt FROM sales WHERE 1=1${posStoreFilter('sales')}`);
      this.state.saleCount = sales.rows[0]?.cnt || 0;
      logger.info(`Initial state: ${this.state.productCount} mahsulot, ${this.state.saleCount} savdo kuzatuvda`);
    } catch (err: any) {
      logger.error(`Notification worker init error: ${err?.message || err}`);
    }
  }

  async checkAndSend(forceHourly = false): Promise<void> {
    const now = Date.now();
    // MUHIM: timestamp faqat muvaffaqiyatli yuborilgandan keyin saqlanadi.
    // Oldin timestamp oldin saqlanardi — Telegram xatosida o'sha soat yo'qolardi.
    if (APP_CONFIG.hourlyAnalysisEnabled && (forceHourly || now - this.state.lastHourlySent >= 3600000)) {
      const ok = await this.sendHourlyAnalysis();
      if (ok) await this.saveLastHourlySent(Date.now());
      else logger.warn('Soatlik hisobot yuborilmadi — keyingi tekshiruvda qayta uriniladi');
    }
    await this.checkDailyReport();
    if (APP_CONFIG.changeNotificationsEnabled) {
      await this.checkForChanges();
    }
  }

  private todayKey(): string {
    return new Date().toISOString().split('T')[0];
  }

  private async checkDailyReport(): Promise<void> {
    try {
      const hour = new Date().getHours();
      if (hour !== APP_CONFIG.dailyReportHour) return;
      if (this.state.lastDailySent === this.todayKey()) return;
      const data = await reportsService.generateDaily(1);
      const text = formatDailyHTML(data);
      const ok = await this.sendToOwner(text);
      if (ok) {
        this.state.lastDailySent = this.todayKey();
        await db.run(
          `INSERT INTO worker_state (key, value, updated_at) VALUES ('last_daily_sent', $1, datetime('now'))
           ON CONFLICT(key) DO UPDATE SET value = $1, updated_at = datetime('now')`,
          [this.state.lastDailySent]
        );
        logger.info('Kunlik hisobot yuborildi');
      }
    } catch (err: any) {
      logger.error(`Daily report error: ${err?.message || err}`);
    }
  }

  private async sendHourlyAnalysis(): Promise<boolean> {
    logger.info('Soatlik analiz yuborilmoqda...');
    try {
      const analysis = await withRetry(async () => {
        const sales = await posDb.query(`
          SELECT COUNT(*) as order_count, COALESCE(SUM(total_amount), 0) as revenue
          FROM sales WHERE DATE(created_at) = DATE('now')${posStoreFilter('sales')}
        `);
        const lastHour = await posDb.query(`
          SELECT COUNT(*) as order_count, COALESCE(SUM(total_amount), 0) as revenue
          FROM sales WHERE datetime(created_at) >= datetime('now', '-60 minutes')${posStoreFilter('sales')}
        `);
        const lowStock = await posDb.query(`
          SELECT name, stock_quantity, minimum_stock FROM products
          WHERE stock_quantity <= minimum_stock${posStoreFilter('products')}
          ORDER BY stock_quantity ASC LIMIT 5
        `);
        const topProducts = await posDb.query(`
          SELECT p.name, SUM(si.quantity) as sold FROM sale_items si
          JOIN products p ON si.product_id = p.id
          JOIN sales s ON s.id = si.sale_id
          WHERE DATE(s.created_at) = DATE('now')${posStoreFilter('sales', 's')}
          GROUP BY p.id ORDER BY sold DESC LIMIT 5
        `);
        const productCount = await posDb.query(`SELECT COUNT(*) as cnt FROM products WHERE 1=1${posStoreFilter('products')}`);
        const inventoryTotal = await posDb.query(`
          SELECT COALESCE(SUM(stock_quantity), 0) as total FROM products WHERE 1=1${posStoreFilter('products')}
        `);
        const row = sales.rows[0] || {};
        const lh = lastHour.rows[0] || {};
        return {
          hour: new Date().toLocaleTimeString('uz-UZ', { hour: '2-digit', minute: '2-digit', hour12: false }),
          hour_revenue: lh.revenue || 0,
          hour_orders: lh.order_count || 0,
          total_revenue: row.revenue || 0,
          order_count: row.order_count || 0,
          total_products: productCount.rows[0]?.cnt || 0,
          total_stock: inventoryTotal.rows[0]?.total || 0,
          low_stock: lowStock.rows,
          top_products: topProducts.rows,
        };
      }, 3, 1000, 'hourly_analysis');

      const text = this.formatHourlyMessage(analysis);
      const sent = await this.sendToOwner(text);
      if (!sent) return false;

      const inventory = await posDb.query(`SELECT name, stock_quantity FROM products WHERE 1=1${posStoreFilter('products')}`);
      this.state.inventorySnapshot = {};
      for (const p of inventory.rows) {
        this.state.inventorySnapshot[p.name] = p.stock_quantity;
      }
      logger.info('Soatlik analiz yuborildi');
      return true;
    } catch (err: any) {
      logger.error(`Hourly analysis error: ${err?.message || err}`);
      return false;
    }
  }

  private formatHourlyMessage(data: any): string {
    return formatHourlyHTML(data);
  }

  private async checkForChanges(): Promise<void> {
    try {
      if (!posDb.isAvailable) return;

      // Yangi mahsulotlar
      const productCountRes = await posDb.query(`SELECT COUNT(*) as cnt FROM products WHERE 1=1${posStoreFilter('products')}`);
      const currentCount = productCountRes.rows[0]?.cnt || 0;
      if (this.state.productCount > 0 && currentCount > this.state.productCount) {
        const fresh = await posDb.query(`
          SELECT name, selling_price FROM products
          WHERE datetime(created_at) >= datetime('now', '-65 minutes')${posStoreFilter('products')}
          ORDER BY created_at DESC LIMIT 5
        `);
        for (const p of fresh.rows) {
          await this.sendOneTimeNotification('🆕 Yangi mahsulot', `📦 "<b>${p.name}</b>" omborga qo‘shildi!\n💰 Narxi: <b>${formatCurrency(p.selling_price || 0)}</b>`);
        }
        if (fresh.rows.length === 0) {
          await this.sendOneTimeNotification('🆕 Yangi mahsulot', `📦 Omborga <b>${currentCount - this.state.productCount} ta</b> yangi mahsulot qo‘shildi! 🎉`);
        }
      }
      this.state.productCount = currentCount;

      // Ombor o'zgarishlari
      const inventory = await posDb.query(`SELECT name, stock_quantity, minimum_stock FROM products WHERE 1=1${posStoreFilter('products')}`);
      for (const p of inventory.rows) {
        const prev = this.state.inventorySnapshot[p.name];
        this.state.inventorySnapshot[p.name] = p.stock_quantity;
        if (prev !== undefined && prev !== p.stock_quantity && p.stock_quantity <= (p.minimum_stock || 5)) {
          await this.sendOneTimeNotification('⚠️ Kam qolgan mahsulot', `🔴 "<b>${p.name}</b>": atigi <b>${p.stock_quantity} ta</b> qoldi!\n🛒 Tezda buyurtma bering! 🏃`);
        }
      }

      // Yangi savdolar
      const salesRes = await posDb.query(`SELECT COUNT(*) as cnt FROM sales WHERE 1=1${posStoreFilter('sales')}`);
      const currentSales = salesRes.rows[0]?.cnt || 0;
      if (this.state.saleCount > 0 && currentSales > this.state.saleCount) {
        const diff = currentSales - this.state.saleCount;
        const last = await posDb.query(`
          SELECT total_amount FROM sales WHERE 1=1${posStoreFilter('sales')} ORDER BY id DESC LIMIT ${Math.min(diff, 5)}
        `);
        const sum = last.rows.reduce((a: number, r: any) => a + (r.total_amount || 0), 0);
        await this.sendOneTimeNotification('💸 Yangi savdo!', `🎉 <b>${diff} ta</b> yangi savdo: <b>${formatCurrency(sum)}</b> 💰👏`);
      }
      this.state.saleCount = currentSales;
    } catch (err: any) {
      logger.error(`Change detection error: ${err?.message || err}`);
    }
  }

  private async sendOneTimeNotification(title: string, message: string): Promise<void> {
    const eventKey = `${title}:${message}`;
    const now = Date.now();
    const lastSent = this.state.lastEventNotifications[eventKey] || 0;
    if (now - lastSent < this.cooldownMs) return;
    this.state.lastEventNotifications[eventKey] = now;

    try {
      await notificationsService.send({ tenantId: 1, type: 'event_alert', title, message, channel: 'telegram' });
    } catch { /* agent DB yozuvi ixtiyoriy */ }
    await this.sendToOwner(`${title}\n\n${message}`);
    logger.info(`Bildirishnoma yuborildi: ${title}`);
  }

  private async sendToOwner(text: string): Promise<boolean> {
    try {
      if (!APP_CONFIG.botToken) {
        logger.error('BOT_TOKEN topilmadi, xabar yuborilmadi');
        return false;
      }
      const bot = new Telegraf(APP_CONFIG.botToken);
      try {
        await bot.telegram.sendMessage(this.ownerChatId, text, { parse_mode: 'HTML' } as any);
      } catch {
        // HTML parse xatosi bo'lsa — oddiy matn sifatida qayta urinamiz
        const plain = text.replace(/<\/?[^>]+>/g, '');
        await bot.telegram.sendMessage(this.ownerChatId, plain);
      }
      logger.info(`Xabar yuborildi: chat ${this.ownerChatId}`);
      return true;
    } catch (err: any) {
      logger.error(`Xabar yuborilmadi: ${err?.message || err}`);
      return false;
    }
  }
}

export const notificationWorker = new NotificationWorker();
