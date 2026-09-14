import { db } from '../../config/database';
import { posDb, posStoreFilter } from '../../config/posdb';
import { posAdapter } from '../pos/pos.adapter';
import logger from '../../infrastructure/logger';
import cache from '../../infrastructure/cache';
import { APP_CONFIG } from '../../config/app';
import { TOOL_CATEGORIES } from '../../common/constants';
import { sanitizeInput, formatCurrency, formatNumber, truncate } from '../../common/utils';
import { withRetry } from '../../infrastructure/error-handler';
import { ToolSchema, ToolExecutionResult, ToolExecutionContext } from './tools.types';
import { AuditService } from '../audit/audit.service';
import { MemoryService } from '../memory/memory.service';

class ToolRegistry {
  private tools: Map<string, ToolSchema> = new Map();
  private auditService: AuditService;
  private memoryService: MemoryService;

  constructor() {
    this.auditService = new AuditService();
    this.memoryService = new MemoryService();
    this.registerTools();
  }

  private registerTools(): void {
    const readTools = [
      this.createTool('get_sales_summary', 'read', 'Current sales summary', { period: { type: 'string', default: 'today' } }, 'sales', false, 'low', async (ctx, params) => this.getSalesSummary(ctx.tenantId, params)),
      this.createTool('get_sales_by_period', 'read', 'Sales by date period', { from_date: { type: 'string' }, to_date: { type: 'string' } }, 'sales', false, 'low', async (ctx, params) => this.getSalesByPeriod(ctx.tenantId, params)),
      this.createTool('compare_sales', 'read', 'Compare sales between two dates', { date1: { type: 'string' }, date2: { type: 'string' } }, 'sales', false, 'low', async (ctx, params) => this.compareSales(ctx.tenantId, params)),
      this.createTool('get_top_products', 'read', 'Top selling products', { limit: { type: 'number', default: 10 } }, 'sales', false, 'low', async (ctx, params) => this.getTopProducts(ctx.tenantId, params)),
      this.createTool('get_inventory', 'read', 'Full inventory status', { category: { type: 'string', optional: true } }, 'inventory', false, 'low', async (ctx, params) => this.getInventory(ctx.tenantId, params)),
      this.createTool('get_low_stock_products', 'read', 'Low stock products', { threshold: { type: 'number', optional: true } }, 'inventory', false, 'low', async (ctx, params) => this.getLowStock(ctx.tenantId, params)),
      this.createTool('get_product', 'read', 'Get product by name', { name: { type: 'string' } }, 'inventory', false, 'low', async (ctx, params) => this.getProduct(ctx.tenantId, params)),
      this.createTool('search_products', 'read', 'Search products', { query: { type: 'string' } }, 'inventory', false, 'low', async (ctx, params) => this.searchProducts(ctx.tenantId, params)),
      this.createTool('get_orders', 'read', 'Recent orders', { period: { type: 'string', default: 'week' } }, 'orders', false, 'low', async (ctx, params) => this.getOrders(ctx.tenantId, params)),
      this.createTool('get_order', 'read', 'Order by ID', { id: { type: 'number' } }, 'orders', false, 'low', async (ctx, params) => this.getOrder(ctx.tenantId, params)),
      this.createTool('search_customer', 'read', 'Search customer', { name: { type: 'string' } }, 'customers', false, 'low', async (ctx, params) => this.searchCustomer(ctx.tenantId, params)),
      this.createTool('get_customer_orders', 'read', 'Customer order history', { name: { type: 'string' } }, 'customers', false, 'low', async (ctx, params) => this.getCustomerOrders(ctx.tenantId, params)),
      this.createTool('get_customer_summary', 'read', 'Customer summary', { name: { type: 'string' } }, 'customers', false, 'low', async (ctx, params) => this.getCustomerSummary(ctx.tenantId, params)),
      this.createTool('get_business_settings', 'read', 'Business settings', {}, 'settings', false, 'low', async (ctx, params) => this.getBusinessSettings(ctx.tenantId)),
      this.createTool('get_notification_rules', 'read', 'Notification rules', {}, 'automation', false, 'low', async (ctx, params) => this.getNotificationRules(ctx.tenantId)),
      this.createTool('get_automation_rules', 'read', 'Automation rules', {}, 'automation', false, 'low', async (ctx, params) => this.getAutomationRules(ctx.tenantId)),
      this.createTool('get_memory', 'read', 'Search memory', { query: { type: 'string' } }, 'memory', false, 'low', async (ctx, params) => this.getMemory(ctx.tenantId, params)),
      this.createTool('get_reports', 'read', 'Reports list', { type: { type: 'string', optional: true } }, 'reports', false, 'low', async (ctx, params) => this.getReports(ctx.tenantId, params)),
      this.createTool('get_conversations', 'read', 'Conversation history', { limit: { type: 'number', default: 10 } }, 'memory', false, 'low', async (ctx, params) => this.getConversations(ctx.tenantId, params)),
      this.createTool('get_system_status', 'read', 'System status', {}, 'system', false, 'low', async (ctx, params) => this.getSystemStatus(ctx.tenantId)),
      this.createTool('get_audit_logs', 'read', 'Audit logs', { limit: { type: 'number', default: 20 } }, 'audit', false, 'low', async (ctx, params) => this.getAuditLogs(ctx.tenantId, params)),
    ];

    const writeTools = [
      this.createTool('create_order', 'write', 'Create a new order', { customer_name: { type: 'string' }, items: { type: 'array' }, total: { type: 'number' } }, 'orders', true, 'high', async (ctx, params) => this.createOrder(ctx.tenantId, params)),
      this.createTool('update_inventory', 'write', 'Update inventory', { product_id: { type: 'number' }, quantity: { type: 'number' } }, 'inventory', true, 'high', async (ctx, params) => this.updateInventory(ctx.tenantId, params)),
      this.createTool('create_product', 'write', 'Create new product', { name: { type: 'string' }, price: { type: 'number' }, stock: { type: 'number' } }, 'inventory', true, 'high', async (ctx, params) => this.createProduct(ctx.tenantId, params)),
      this.createTool('update_product', 'write', 'Update product', { id: { type: 'number' }, updates: { type: 'object' } }, 'inventory', true, 'medium', async (ctx, params) => this.updateProduct(ctx.tenantId, params)),
      this.createTool('create_notification_rule', 'write', 'Create notification rule', { name: { type: 'string' }, trigger: { type: 'string' }, action: { type: 'string' } }, 'automation', true, 'medium', async (ctx, params) => this.createNotificationRule(ctx.tenantId, params)),
      this.createTool('delete_notification_rule', 'write', 'Delete notification rule', { id: { type: 'number' } }, 'automation', true, 'medium', async (ctx, params) => this.deleteNotificationRule(ctx.tenantId, params)),
      this.createTool('create_automation', 'write', 'Create automation rule', { name: { type: 'string' }, trigger: { type: 'string' }, action: { type: 'string' } }, 'automation', true, 'medium', async (ctx, params) => this.createAutomation(ctx.tenantId, params)),
      this.createTool('delete_automation', 'write', 'Delete automation rule', { id: { type: 'number' } }, 'automation', true, 'medium', async (ctx, params) => this.deleteAutomation(ctx.tenantId, params)),
      this.createTool('update_business_settings', 'write', 'Update business settings', { settings: { type: 'object' } }, 'settings', true, 'medium', async (ctx, params) => this.updateBusinessSettings(ctx.tenantId, params)),
      this.createTool('create_report', 'write', 'Generate report', { type: { type: 'string' }, format: { type: 'string', default: 'text' } }, 'reports', true, 'low', async (ctx, params) => this.createReport(ctx.tenantId, params)),
      this.createTool('send_notification', 'write', 'Send notification', { title: { type: 'string' }, message: { type: 'string' }, channel: { type: 'string', default: 'telegram' } }, 'notifications', true, 'low', async (ctx, params) => this.sendNotification(ctx.tenantId, params)),
      this.createTool('add_memory', 'write', 'Add memory entry', { content: { type: 'string' }, type: { type: 'string', default: 'important_fact' } }, 'memory', true, 'low', async (ctx, params) => this.addMemory(ctx.tenantId, params)),
    ];

    [...readTools, ...writeTools].forEach(t => this.tools.set(t.name, t));
  }

  private createTool(
    name: string,
    type: 'read' | 'write',
    description: string,
    parameters: Record<string, any>,
    category: string,
    tenantRequired: boolean,
    riskLevel: 'low' | 'medium' | 'high',
    handler: Function
  ): ToolSchema {
    return {
      name, type, description,
      parameters: { type: 'object', properties: parameters },
      tenantRequired,
      requireConfirmation: riskLevel === 'high',
      riskLevel,
      category,
      handler,
    };
  }

  async execute(toolName: string, input: Record<string, any>, tenantId: number, requestId: string): Promise<any> {
    const tool = this.tools.get(toolName);
    if (!tool) throw new Error(`Tool "${toolName}" not found`);

    const start = Date.now();
    const ctx = { tenantId, requestId };

    try {
      if (tool.requireConfirmation && !input.confirm) {
        return {
          success: true,
          confirmationRequired: true,
          message: `${toolName} action requires confirmation`,
          toolName,
          executionTimeMs: Date.now() - start,
        };
      }

      const result = await withRetry(
        () => (tool.handler as Function)(ctx, input),
        APP_CONFIG.agentRetryAttempts,
        APP_CONFIG.agentRetryDelay,
        `tool:${toolName}`
      );

      await db.run(`
        INSERT INTO tool_calls (tenant_id, tool_name, tool_type, input, output, status, execution_time_ms, created_at)
        VALUES ($1, $2, $3, $4, $5, 'success', $6, datetime('now'))
      `, [tenantId, toolName, tool.type, JSON.stringify(input), JSON.stringify(result), Date.now() - start]);

      await cache.invalidate(`tenant:${tenantId}:*`);

      return result;
    } catch (err: any) {
      await db.run(`
        INSERT INTO tool_calls (tenant_id, tool_name, tool_type, input, output, status, execution_time_ms, created_at)
        VALUES ($1, $2, $3, $4, $5, 'error', $6, datetime('now'))
      `, [tenantId, toolName, tool.type, JSON.stringify(input), err.message, Date.now() - start]);

      logger.error(`Tool ${toolName} error: ${err.message}`);
      return { success: false, error: err.message, toolName, executionTimeMs: Date.now() - start };
    }
  }

  getTool(name: string): ToolSchema | undefined {
    return this.tools.get(name);
  }

  getAllTools(): ToolSchema[] {
    return Array.from(this.tools.values());
  }

  getReadTools(): ToolSchema[] {
    return this.getAllTools().filter(t => t.type === 'read');
  }

  getWriteTools(): ToolSchema[] {
    return this.getAllTools().filter(t => t.type === 'write');
  }

  private async getSalesSummary(tenantId: number, params: any): Promise<any> {
    const period = params.period || 'today';
    const cacheKey = `tenant:${tenantId}:sales_summary:${period}`;
    const cached = await cache.get(cacheKey);
    if (cached) return cached;
    const dateFilter = period === 'today' ? `DATE(created_at) = DATE('now')` : `DATE(created_at) >= DATE('now', '-7 days')`;
    const result = await posDb.query(`
      SELECT COUNT(*) as order_count, COALESCE(SUM(total_amount), 0) as total_revenue,
        COALESCE(AVG(total_amount), 0) as avg_order
      FROM sales WHERE ${dateFilter}${posStoreFilter('sales')}
    `);
    const data = { ...result.rows[0], period };
    await cache.set(cacheKey, data, 300);
    return data;
  }

  private async getSalesByPeriod(tenantId: number, params: any): Promise<any> {
    const { from_date, to_date } = params;
    if (!from_date || !to_date) throw new Error('from_date va to_date kerak (YYYY-MM-DD)');
    const result = await posDb.query(`
      SELECT COUNT(*) as order_count, COALESCE(SUM(total_amount), 0) as total_revenue,
        COALESCE(AVG(total_amount), 0) as avg_order
      FROM sales WHERE DATE(created_at) BETWEEN $1 AND $2${posStoreFilter('sales')}
    `, [from_date, to_date]);
    return { ...result.rows[0], from_date, to_date };
  }

  private async compareSales(tenantId: number, params: any): Promise<any> {
    const { date1, date2 } = params;
    if (!date1 || !date2) throw new Error('date1 va date2 kerak (YYYY-MM-DD)');
    const result = await posDb.query(`
      SELECT DATE(created_at) as d, COUNT(*) as cnt, COALESCE(SUM(total_amount), 0) as rev
      FROM sales WHERE DATE(created_at) IN ($1, $2)${posStoreFilter('sales')}
      GROUP BY DATE(created_at)
    `, [date1, date2]);
    const data: Record<string, any> = {};
    result.rows.forEach((r: any) => { data[r.d] = { count: r.cnt, revenue: r.rev }; });
    return data;
  }

  private async getTopProducts(tenantId: number, params: any): Promise<any> {
    const limit = Math.min(params.limit || 10, 50);
    const result = await posDb.query(`
      SELECT p.name, SUM(si.quantity) as total_sold, SUM(si.quantity * si.price) as revenue
      FROM sale_items si
      JOIN products p ON si.product_id = p.id
      JOIN sales s ON s.id = si.sale_id
      WHERE DATE(s.created_at) = DATE('now')${posStoreFilter('sales', 's')}${posStoreFilter('products', 'p')}
      GROUP BY p.id ORDER BY total_sold DESC LIMIT $1
    `, [limit]);
    return result.rows;
  }

  private async getInventory(tenantId: number, params: any): Promise<any> {
    const cacheKey = `tenant:${tenantId}:inventory:${params.category || 'all'}`;
    const cached = await cache.get(cacheKey);
    if (cached) return cached;
    const category = (params.category || '').trim();
    let result;
    if (category) {
      result = await posDb.query(`
        SELECT p.* FROM products p LEFT JOIN categories c ON c.id = p.category_id
        WHERE (c.name LIKE $1 OR p.name LIKE $1)${posStoreFilter('products', 'p')}
        ORDER BY p.name LIMIT 100
      `, [`%${category}%`]);
    } else {
      result = await posDb.query(`
        SELECT * FROM products WHERE 1=1${posStoreFilter('products')} ORDER BY name LIMIT 100
      `);
    }
    await cache.set(cacheKey, result.rows, 300);
    return result.rows;
  }

  private async getLowStock(tenantId: number, params: any): Promise<any> {
    const threshold = params.threshold || (await this.getLowStockThreshold(tenantId));
    const result = await posDb.query(`
      SELECT name, stock_quantity, minimum_stock, selling_price FROM products
      WHERE (stock_quantity <= $1 OR stock_quantity <= minimum_stock)${posStoreFilter('products')}
      ORDER BY stock_quantity ASC LIMIT 50
    `, [threshold]);
    return result.rows;
  }

  private async getProduct(tenantId: number, params: any): Promise<any> {
    if (!params.name) throw new Error('Mahsulot nomi kerak');
    const result = await posDb.query(`
      SELECT * FROM products WHERE name LIKE $1${posStoreFilter('products')} LIMIT 5
    `, [`%${params.name}%`]);
    return result.rows[0] || null;
  }

  private async searchProducts(tenantId: number, params: any): Promise<any> {
    if (!params.query) throw new Error('Qidiruv so‘zi kerak');
    const result = await posDb.query(`
      SELECT id, name, selling_price, stock_quantity, minimum_stock, unit, barcode, status
      FROM products WHERE (name LIKE $1 OR barcode LIKE $1)${posStoreFilter('products')}
      ORDER BY name LIMIT 20
    `, [`%${params.query}%`]);
    return result.rows;
  }

  private async getOrders(tenantId: number, params: any): Promise<any> {
    const result = await posDb.query(`
      SELECT s.*, (SELECT COUNT(*) FROM sale_items si WHERE si.sale_id = s.id) as item_count
      FROM sales s WHERE DATE(s.created_at) >= DATE('now', '-7 days')${posStoreFilter('sales', 's')}
      ORDER BY s.created_at DESC LIMIT 10
    `);
    return result.rows;
  }

  private async getOrder(tenantId: number, params: any): Promise<any> {
    if (!params.id) throw new Error('Buyurtma ID kerak');
    const sale = await posDb.query(`SELECT * FROM sales WHERE id = $1${posStoreFilter('sales')}`, [params.id]);
    if (sale.rows.length === 0) return null;
    const items = await posDb.query(`
      SELECT si.*, p.name as product_name FROM sale_items si
      LEFT JOIN products p ON p.id = si.product_id WHERE si.sale_id = $1
    `, [params.id]);
    return { ...sale.rows[0], items: items.rows };
  }

  private async searchCustomer(tenantId: number, params: any): Promise<any> {
    if (!params.name) throw new Error('Mijoz ismi kerak');
    const result = await posDb.query(`
      SELECT * FROM customers WHERE name LIKE $1${posStoreFilter('customers')} LIMIT 5
    `, [`%${params.name}%`]);
    return result.rows[0] || null;
  }

  private async getCustomerOrders(tenantId: number, params: any): Promise<any> {
    if (!params.name) throw new Error('Mijoz ismi kerak');
    const result = await posDb.query(`
      SELECT id, total_amount, payment_method, created_at FROM sales
      WHERE customer_name LIKE $1${posStoreFilter('sales')}
      ORDER BY created_at DESC LIMIT 10
    `, [`%${params.name}%`]);
    return result.rows;
  }

  private async getCustomerSummary(tenantId: number, params: any): Promise<any> {
    if (!params.name) throw new Error('Mijoz ismi kerak');
    const customer = await posDb.query(`
      SELECT * FROM customers WHERE name LIKE $1${posStoreFilter('customers')} LIMIT 1
    `, [`%${params.name}%`]);
    const sales = await posDb.query(`
      SELECT COUNT(*) as order_count, COALESCE(SUM(total_amount), 0) as total_spent,
        MAX(created_at) as last_order_at FROM sales
      WHERE customer_name LIKE $1${posStoreFilter('sales')}
    `, [`%${params.name}%`]);
    return { customer: customer.rows[0] || null, ...sales.rows[0] };
  }

  private async getBusinessSettings(tenantId: number): Promise<any> {
    const cached = await cache.get(`tenant:${tenantId}:settings`);
    if (cached) return cached;
    const result = await db.query(`SELECT * FROM business_settings WHERE tenant_id = $1`, [tenantId]);
    const settings = result.rows[0] || {};
    await cache.set(`tenant:${tenantId}:settings`, settings);
    return settings;
  }

  private async getNotificationRules(tenantId: number): Promise<any> {
    const result = await db.query(`SELECT * FROM automations WHERE tenant_id = $1 AND trigger_type = 'threshold'`, [tenantId]);
    return result.rows;
  }

  private async getAutomationRules(tenantId: number): Promise<any> {
    const result = await db.query(`SELECT * FROM automations WHERE tenant_id = $1`, [tenantId]);
    return result.rows;
  }

  private async getMemory(tenantId: number, params: any): Promise<any> {
    const result = await db.query(`
      SELECT * FROM memories WHERE tenant_id = $1 AND content LIKE $2 ORDER BY importance DESC LIMIT 10
    `, [tenantId, `%${params.query}%`]);
    return result.rows;
  }

  private async getReports(tenantId: number, params: any): Promise<any> {
    const result = await db.query(`SELECT * FROM reports WHERE tenant_id = $1 ORDER BY created_at DESC LIMIT 20`, [tenantId]);
    return result.rows;
  }

  private async getConversations(tenantId: number, params: any): Promise<any> {
    const result = await db.query(`SELECT * FROM conversations WHERE tenant_id = $1 LIMIT $2`, [tenantId, params.limit || 10]);
    return result.rows;
  }

  private async getSystemStatus(tenantId: number): Promise<any> {
    return { status: 'operational', tenant_id: tenantId };
  }

  private async getAuditLogs(tenantId: number, params: any): Promise<any> {
    const result = await db.query(`SELECT * FROM audit_logs WHERE tenant_id = $1 ORDER BY created_at DESC LIMIT $2`, [tenantId, params.limit || 20]);
    return result.rows;
  }

  private async createOrder(tenantId: number, params: any): Promise<any> {
    if (!params.items || !Array.isArray(params.items) || params.items.length === 0) {
      throw new Error('Buyurtma uchun items ro‘yxati kerak');
    }
    const total = params.items.reduce((s: number, i: any) => s + (i.quantity || 0) * (i.price || 0), 0);
    const res = await posAdapter.createSale({
      customer_name: params.customer_name,
      payment_method: params.payment_method || 'cash',
      received_amount: params.received_amount ?? total,
      items: params.items,
      notes: params.notes,
    });
    if (!res.success) throw new Error(`POS buyurtma yaratilmadi: ${res.error}`);
    await cache.invalidate(`tenant:${tenantId}:*`);
    return { success: true, order: res.data };
  }

  private async updateInventory(tenantId: number, params: any): Promise<any> {
    if (!params.product_id || params.quantity === undefined) {
      throw new Error('product_id va quantity kerak');
    }
    const res = await posAdapter.adjustInventory({
      product_id: params.product_id,
      quantity: Math.abs(params.quantity),
      change_type: params.change_type || (params.quantity >= 0 ? 'purchase' : 'sale'),
      note: params.note || 'Telegram agent orqali',
    });
    if (!res.success) throw new Error(`Ombor yangilanmadi: ${res.error}`);
    await cache.invalidate(`tenant:${tenantId}:*`);
    return { success: true, result: res.data };
  }

  private async createProduct(tenantId: number, params: any): Promise<any> {
    if (!params.name || params.price === undefined) throw new Error('Mahsulot nomi va narxi kerak');
    const res = await posAdapter.createPosProduct({
      name: params.name,
      selling_price: params.price,
      purchase_price: params.purchase_price || 0,
      stock_quantity: params.stock || 0,
      minimum_stock: params.minimum_stock ?? 5,
      unit: params.unit || 'pcs',
      barcode: params.barcode,
    });
    if (!res.success) throw new Error(`Mahsulot yaratilmadi: ${res.error}`);
    await cache.invalidate(`tenant:${tenantId}:*`);
    return { success: true, product: res.data };
  }

  private async updateProduct(tenantId: number, params: any): Promise<any> {
    if (!params.id || !params.updates) throw new Error('Mahsulot id va updates kerak');
    const res = await posAdapter.updatePosProduct(params.id, params.updates);
    if (!res.success) throw new Error(`Mahsulot yangilanmadi: ${res.error}`);
    await cache.invalidate(`tenant:${tenantId}:*`);
    return { success: true, product: res.data };
  }

  private async createNotificationRule(tenantId: number, params: any): Promise<any> {
    const result = await db.run(`
      INSERT INTO automations (tenant_id, name, trigger_type, trigger_config, action_type, action_config, is_active)
      VALUES ($1, $2, 'threshold', $3, 'notification', $4, 1)
    `, [tenantId, params.name, params.trigger, params.action]);
    return { success: true, ruleId: result.lastInsertRowid };
  }

  private async deleteNotificationRule(tenantId: number, params: any): Promise<any> {
    await db.run(`DELETE FROM automations WHERE id = $1 AND tenant_id = $2`, [params.id, tenantId]);
    return { success: true };
  }

  private async createAutomation(tenantId: number, params: any): Promise<any> {
    const result = await db.run(`
      INSERT INTO automations (tenant_id, name, trigger_type, trigger_config, action_type, action_config, is_active)
      VALUES ($1, $2, $3, $4, 'command', $5, 1)
    `, [tenantId, params.name, params.trigger, params.action, params.action]);
    return { success: true, automationId: result.lastInsertRowid };
  }

  private async deleteAutomation(tenantId: number, params: any): Promise<any> {
    await db.run(`DELETE FROM automations WHERE id = $1 AND tenant_id = $2`, [params.id, tenantId]);
    return { success: true };
  }

  private async updateBusinessSettings(tenantId: number, params: any): Promise<any> {
    await db.run(`UPDATE business_settings SET settings = $1, updated_at = datetime('now') WHERE tenant_id = $2`, [JSON.stringify(params.settings), tenantId]);
    await cache.invalidate(`tenant:${tenantId}:settings`);
    return { success: true };
  }

  private async createReport(tenantId: number, params: any): Promise<any> {
    const result = await db.run(`
      INSERT INTO reports (tenant_id, report_type, title, status, format)
      VALUES ($1, $2, $3, 'pending', $4)
    `, [tenantId, params.type, `${params.type} report`, params.format || 'text']);
    return { success: true, reportId: result.lastInsertRowid };
  }

  private async sendNotification(tenantId: number, params: any): Promise<any> {
    await db.run(`
      INSERT INTO notifications (tenant_id, type, title, message, channel, status)
      VALUES ($1, 'alert', $2, $3, $4, 'sent')
    `, [tenantId, params.title, params.message, params.channel || 'telegram']);
    return { success: true };
  }

  private async addMemory(tenantId: number, params: any): Promise<any> {
    await db.run(`
      INSERT INTO memories (tenant_id, type, content, importance, tags, created_at)
      VALUES ($1, $2, $3, 5, '[]', datetime('now'))
    `, [tenantId, params.type || 'important_fact', params.content]);
    return { success: true };
  }

  private async getLowStockThreshold(tenantId: number): Promise<number> {
    const settings = await db.query(`SELECT low_stock_threshold FROM business_settings WHERE tenant_id = $1`, [tenantId]);
    return settings.rows[0]?.low_stock_threshold || 5;
  }
}

export const toolRegistry = new ToolRegistry();
export default toolRegistry;
