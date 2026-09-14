import { db } from '../../config/database';
import { posDb, posStoreFilter } from '../../config/posdb';
import cache from '../../infrastructure/cache';
import { formatCurrency } from '../../common/utils';
import { withRetry } from '../../infrastructure/error-handler';

export class ReportsService {
  async generateDaily(_tenantId: number): Promise<any> {
    return withRetry(async () => {
      const today = await posDb.query(`
        SELECT COUNT(*) as order_count, COALESCE(SUM(total_amount), 0) as total_revenue,
          COALESCE(AVG(total_amount), 0) as avg_order,
          (SELECT COUNT(*) FROM sales WHERE DATE(created_at) = DATE('now', '-1 day')${posStoreFilter('sales')}) as yesterday_orders,
          (SELECT COALESCE(SUM(total_amount), 0) FROM sales WHERE DATE(created_at) = DATE('now', '-1 day')${posStoreFilter('sales')}) as yesterday_revenue
        FROM sales WHERE DATE(created_at) = DATE('now')${posStoreFilter('sales')}
      `);

      const topProducts = await posDb.query(`
        SELECT p.name, SUM(si.quantity) as sold, ROUND(SUM(si.quantity * si.price), 0) as revenue
        FROM sale_items si
        JOIN products p ON si.product_id = p.id
        JOIN sales s ON s.id = si.sale_id
        WHERE DATE(s.created_at) = DATE('now')${posStoreFilter('sales', 's')}
        GROUP BY p.id ORDER BY sold DESC LIMIT 5
      `);

      const lowStock = await posDb.query(`
        SELECT name, stock_quantity FROM products
        WHERE stock_quantity <= minimum_stock${posStoreFilter('products')}
        ORDER BY stock_quantity ASC LIMIT 5
      `);

      const customers = await posDb.query(`
        SELECT COUNT(DISTINCT customer_name) as unique_customers FROM sales
        WHERE DATE(created_at) = DATE('now') AND customer_name IS NOT NULL AND customer_name != ''${posStoreFilter('sales')}
      `);

      const row = today.rows[0] || {};
      const data = {
        date: new Date().toISOString().split('T')[0],
        total_revenue: row.total_revenue || 0,
        order_count: row.order_count || 0,
        avg_order: row.avg_order || 0,
        unique_customers: customers.rows[0]?.unique_customers || 0,
        yesterday_orders: row.yesterday_orders || 0,
        yesterday_revenue: row.yesterday_revenue || 0,
        top_products: topProducts.rows,
        low_stock: lowStock.rows,
      };

      await this.saveReport(_tenantId, 'daily', 'Kunlik hisobot', data);
      return data;
    }, 3, 1000, 'daily_report');
  }

  async generateWeekly(_tenantId: number): Promise<any> {
    return withRetry(async () => {
      const result = await posDb.query(`
        SELECT COUNT(*) as total_orders, COALESCE(SUM(total_amount), 0) as total_revenue,
          COALESCE(AVG(total_amount), 0) as avg_order,
          (SELECT COALESCE(SUM(total_amount), 0) FROM sales
           WHERE DATE(created_at) >= DATE('now', '-14 days') AND DATE(created_at) < DATE('now', '-7 days')${posStoreFilter('sales')}) as prev_week_revenue
        FROM sales WHERE DATE(created_at) >= DATE('now', '-7 days')${posStoreFilter('sales')}
      `);

      const topProducts = await posDb.query(`
        SELECT p.name, SUM(si.quantity) as total_sold, ROUND(SUM(si.quantity * si.price), 0) as revenue
        FROM sale_items si
        JOIN products p ON si.product_id = p.id
        JOIN sales s ON s.id = si.sale_id
        WHERE DATE(s.created_at) >= DATE('now', '-7 days')${posStoreFilter('sales', 's')}
        GROUP BY p.id ORDER BY total_sold DESC LIMIT 10
      `);

      const row = result.rows[0] || {};
      const prev = row.prev_week_revenue || 0;
      const data = {
        week_start: new Date(Date.now() - 7 * 86400000).toISOString().split('T')[0],
        week_end: new Date().toISOString().split('T')[0],
        total_orders: row.total_orders || 0,
        total_revenue: row.total_revenue || 0,
        avg_order: row.avg_order || 0,
        revenue_change_pct: prev > 0 ? (((row.total_revenue || 0) - prev) / prev * 100).toFixed(1) : '0.0',
        top_products: topProducts.rows,
      };

      await this.saveReport(_tenantId, 'weekly', 'Haftalik hisobot', data);
      return data;
    }, 3, 1000, 'weekly_report');
  }

  async generateMonthly(_tenantId: number): Promise<any> {
    return withRetry(async () => {
      const result = await posDb.query(`
        SELECT COUNT(*) as total_orders, COALESCE(SUM(total_amount), 0) as total_revenue
        FROM sales WHERE strftime('%Y-%m', created_at) = strftime('%Y-%m', 'now')${posStoreFilter('sales')}
      `);

      const customerActivity = await posDb.query(`
        SELECT COUNT(DISTINCT customer_name) as active_customers FROM sales
        WHERE strftime('%Y-%m', created_at) = strftime('%Y-%m', 'now')
          AND customer_name IS NOT NULL AND customer_name != ''${posStoreFilter('sales')}
      `);

      const row = result.rows[0] || {};
      const data = {
        month: new Date().toISOString().slice(0, 7),
        total_orders: row.total_orders || 0,
        total_revenue: row.total_revenue || 0,
        avg_order: row.total_revenue ? (row.total_revenue / Math.max(row.total_orders, 1)) : 0,
        active_customers: customerActivity.rows[0]?.active_customers || 0,
      };

      await this.saveReport(_tenantId, 'monthly', 'Oylik hisobot', data);
      return data;
    }, 3, 1000, 'monthly_report');
  }

  async generateTextReport(data: any, type = 'daily'): Promise<string> {
    const title = type === 'daily' ? 'Kunlik' : type === 'weekly' ? 'Haftalik' : 'Oylik';
    const top = data.top_products
      ? data.top_products.map((p: any) => `- ${p.name}: ${p.sold || p.total_sold} dona`).join('\n')
      : '';
    const low = data.low_stock
      ? data.low_stock.map((p: any) => `- ${p.name}: ${p.stock_quantity} ta`).join('\n')
      : "Yo'q";

    let report = `${title} hisobot\n\n`;
    report += `Tushum: ${formatCurrency(data.total_revenue || 0)}\n`;
    report += `Buyurtmalar: ${data.order_count || data.total_orders || 0} ta\n`;
    report += `O'rtacha chek: ${formatCurrency(data.avg_order || 0)}\n`;
    if (data.unique_customers || data.active_customers) {
      report += `Xaridorlar: ${data.unique_customers || data.active_customers} ta\n`;
    }
    report += `\nTop mahsulotlar:\n${top || "Ma'lumot yo'q"}\n\nKam qolgan:\n${low}`;
    return report;
  }

  async saveReport(tenantId: number, type: string, title: string, data: any): Promise<any> {
    try {
      const result = await db.run(`
        INSERT INTO reports (tenant_id, report_type, title, data, status, generated_at)
        VALUES ($1, $2, $3, $4, 'generated', datetime('now'))
      `, [tenantId, type, title, JSON.stringify(data)]);
      await cache.invalidate(`tenant:${tenantId}:reports`);
      return { id: result.lastInsertRowid, success: true };
    } catch {
      return { success: false };
    }
  }
}

export const reportsService = new ReportsService();
