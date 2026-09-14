export const ROLE_HIERARCHY = {
  super_admin: 200,
  admin: 150,
  business_owner: 100,
  manager: 80,
  stock: 60,
  cashier: 40,
  employee: 20,
  view: 10,
} as const;

export const ROLE_PERMISSIONS: Record<string, string[]> = {
  super_admin: ['*'],
  admin: ['*'],
  business_owner: ['sales:read', 'sales:write', 'products:read', 'products:write', 'inventory:read', 'inventory:write', 'customers:read', 'customers:write', 'reports:read', 'reports:write', 'automations:read', 'automations:write', 'settings:read', 'settings:write', 'users:read', 'users:write'],
  manager: ['sales:read', 'sales:write', 'products:read', 'products:write', 'inventory:read', 'inventory:write', 'customers:read', 'customers:write', 'reports:read', 'automations:read'],
  stock: ['inventory:read', 'inventory:write', 'products:read', 'suppliers:read'],
  cashier: ['sales:read', 'sales:write', 'products:read', 'inventory:read'],
  employee: ['sales:read', 'inventory:read', 'view'],
  view: ['sales:read', 'inventory:read'],
};

export const TOOL_CATEGORIES = {
  READ: ['get_sales_summary', 'get_sales_by_period', 'compare_sales', 'get_top_products', 'get_inventory', 'get_low_stock_products', 'get_product', 'search_products', 'get_orders', 'get_order', 'search_customer', 'get_customer_orders', 'get_customer_summary', 'get_business_settings', 'get_notification_rules', 'get_automation_rules', 'get_memory', 'get_reports', 'get_conversations', 'get_system_status', 'get_audit_logs'],
  WRITE: ['create_order', 'update_order', 'update_inventory', 'create_product', 'update_product', 'create_notification_rule', 'delete_notification_rule', 'create_automation', 'delete_automation', 'update_business_settings', 'create_report', 'send_notification', 'add_memory', 'confirm_action'],
} as const;

export const LANGUAGE_SUPPORT = ['uz', 'ru', 'en'] as const;
export type Language = typeof LANGUAGE_SUPPORT[number];

export const MESSAGE_TYPES = ['text', 'photo', 'document', 'sticker', 'voice', 'location', 'contact', 'poll'] as const;

export const CONVERSATION_STATUS = ['active', 'archived', 'closed'] as const;
export type ConversationStatus = typeof CONVERSATION_STATUS[number];

export const TASK_STATUS = ['pending', 'running', 'completed', 'failed', 'cancelled'] as const;
export type TaskStatus = typeof TASK_STATUS[number];

export const AUTOMATION_TRIGGERS = ['schedule', 'threshold', 'event', 'pattern'] as const;
export type AutomationTrigger = typeof AUTOMATION_TRIGGERS[number];

export const AUTOMATION_ACTIONS = ['report', 'notification', 'command', 'alert', 'webhook'] as const;
export type AutomationAction = typeof AUTOMATION_ACTIONS[number];

export const SYSTEM_SEVERITY = ['info', 'warning', 'error', 'critical'] as const;
export type SystemSeverity = typeof SYSTEM_SEVERITY[number];
