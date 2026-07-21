const { z } = require('zod');

const loginSchema = z.object({
  email: z.string().email('Invalid email address'),
  password: z.string().min(1, 'Password is required'),
  remember: z.boolean().optional(),
});

const registerSchema = z.object({
  name: z.string().min(2, 'Name must be at least 2 characters'),
  email: z.string().email('Invalid email address'),
  password: z.string().min(6, 'Password must be at least 6 characters'),
  role_id: z.number().int().optional(),
});

const productSchema = z.object({
  name: z.string().min(1, 'Product name is required'),
  category_id: z.number().int().nullable().optional(),
  selling_price: z.number().min(0, 'Selling price must be positive'),
  stock_quantity: z.number().int().min(0).optional(),
  minimum_stock: z.number().int().min(0).optional(),
  unit: z.string().optional(),
  barcode: z.string().optional(),
  description: z.string().optional(),
  status: z.enum(['active', 'inactive']).optional(),
  image_url: z.string().optional(),
});

const categorySchema = z.object({
  name: z.string().min(1, 'Category name is required'),
  description: z.string().optional(),
});

const saleItemSchema = z.object({
  product_id: z.coerce.number().int(),
  quantity: z.coerce.number().int().positive(),
  price: z.coerce.number().min(0),
  discount: z.coerce.number().min(0).optional(),
  tax: z.coerce.number().min(0).optional(),
});

const saleSchema = z.object({
  customer_name: z.string().optional(),
  payment_method: z.enum(['cash', 'card', 'other']),
  received_amount: z.number().min(0),
  items: z.array(saleItemSchema).min(1, 'At least one item is required'),
  notes: z.string().optional(),
});

const settingsSchema = z.object({
  store_name: z.string().optional(),
  store_address: z.string().optional(),
  store_phone: z.string().optional(),
  store_email: z.string().email().optional().or(z.literal('')),
  currency: z.string().optional(),
  currency_symbol: z.string().optional(),
  tax_percentage: z.number().min(0).max(100).optional(),
  receipt_header: z.string().optional(),
  receipt_footer: z.string().optional(),
  low_stock_threshold: z.number().int().min(0).optional(),
});

module.exports = {
  loginSchema,
  registerSchema,
  productSchema,
  categorySchema,
  saleSchema,
  settingsSchema,
};
