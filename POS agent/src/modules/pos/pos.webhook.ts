import { Router } from 'express';
import { db } from '../../config/database';
import { posDb, posStoreFilter } from '../../config/posdb';
import logger from '../../infrastructure/logger';
import cache from '../../infrastructure/cache';
import { notificationsService } from '../notifications/notifications.service';
import { APP_CONFIG } from '../../config/app';

const router = Router();
let lastProductCount = 0;
let lastInventorySnapshot: Record<string, number> = {};

export function initWebhookListener(): void {
  setInterval(() => detectChanges(), 60000);
  logger.info('🔍 POS change detection listener started');
}

export function registerRoutes(): Router {
  router.post('/webhook', async (req, res) => {
    try {
      const { event, data } = req.body;
      await handleWebhookEvent(event, data);
      res.json({ success: true });
    } catch (err) {
      res.status(500).json({ error: err });
    }
  });

  router.get('/changes', async (_req, res) => {
    try {
      const changes = await detectChanges();
      res.json(changes);
    } catch (err) {
      res.status(500).json({ error: err });
    }
  });

  return router;
}

async function handleWebhookEvent(event: string, data: any): Promise<void> {
  const tenantId = 1;

  switch (event) {
    case 'product.created':
      await notificationsService.send({
        tenantId, type: 'product_created', title: '🆕 Yangi mahsulot',
        message: `"${data.name}" qo'shildi! Narxi: ${data.price}`, channel: 'telegram'
      });
      await notifyOwner(`🆕 Yangi mahsulot: ${data.name}`);
      break;
    case 'product.updated':
      await notificationsService.send({
        tenantId, type: 'product_updated', title: '📝 Mahsulot yangilandi',
        message: `"${data.name}" yangilandi`, channel: 'telegram'
      });
      await notifyOwner(`📝 Mahsulot yangilandi: ${data.name}`);
      break;
    case 'inventory.low':
      await notificationsService.send({
        tenantId, type: 'inventory_low', title: '⚠️ Kam qolgan mahsulot',
        message: `"${data.name}": ${data.stock_quantity} ta qoldi`, channel: 'telegram'
      });
      await notifyOwner(`⚠️ Kam qolgan: ${data.name}`);
      break;
    case 'order.created':
      await notificationsService.send({
        tenantId, type: 'order_created', title: '🛒 Yangi buyurtma',
        message: `Buyurtma #${data.id}: ${data.total_amount}`, channel: 'telegram'
      });
      await notifyOwner(`🛒 Yangi buyurtma: #${data.id}`);
      break;
  }

  logger.info(`Webhook event: ${event}`);
}

async function detectChanges(): Promise<any[]> {
  const changes: any[] = [];

  try {
    if (!posDb.isAvailable) return changes;
    const productCountResult = await posDb.query(`SELECT COUNT(*) as cnt FROM products WHERE 1=1${posStoreFilter('products')}`);
    const currentCount = productCountResult.rows[0]?.cnt || 0;

    if (lastProductCount > 0 && currentCount > lastProductCount) {
      const newProducts = await posDb.query(`
        SELECT name, selling_price FROM products
        WHERE datetime(created_at) >= datetime('now', '-10 minutes')${posStoreFilter('products')}
      `);

      for (const p of newProducts.rows) {
        changes.push({ type: 'product_created', name: p.name, price: p.selling_price });
        await notifyOwner(`Yangi mahsulot: ${p.name}`);
      }
    }
    lastProductCount = currentCount;

    const inventoryResult = await posDb.query(`SELECT name, stock_quantity FROM products WHERE 1=1${posStoreFilter('products')}`);
    for (const p of inventoryResult.rows) {
      const prev = lastInventorySnapshot[p.name];
      if (prev !== undefined && prev !== p.stock_quantity) {
        changes.push({ type: 'inventory_changed', name: p.name, previous: prev, current: p.stock_quantity });
        lastInventorySnapshot[p.name] = p.stock_quantity;

        if (p.stock_quantity <= 5) {
          await notifyOwner(`⚠️ Kam qolgan: ${p.name} — ${p.stock_quantity} ta`);
        }
      }
      lastInventorySnapshot[p.name] = p.stock_quantity;
    }
  } catch (err) {
    logger.error(`Change detection error: ${err}`);
  }

  return changes;
}

async function notifyOwner(message: string): Promise<void> {
  try {
    const result = await db.run(`
      INSERT INTO notifications (tenant_id, type, title, message, channel, status)
      VALUES (1, 'alert', 'POS Notification', $1, 'telegram', 'sent')
    `, [message]);

    await cache.invalidate('tenant:1:notifications');
    logger.info(`Owner notified: ${message}`);
  } catch (err) {
    logger.error(`Notify owner error: ${err}`);
  }
}
