// Tables that carry a store_id column and must be scoped/backfilled per tenant.
// sale_items/refund_items are reached only via sales/refunds/products joins and
// don't carry their own store_id. roles/app_meta stay global.
module.exports = [
  'users',
  'products',
  'categories',
  'sales',
  'customers',
  'suppliers',
  'settings',
  'shifts',
  'discounts',
  'promo_codes',
  'refunds',
  'audit_logs',
  'inventory_logs',
];
