import { create } from 'zustand';
import { productsAPI } from '../services/api';

export const useCartStore = create((set, get) => ({
  items: [],
  discount: 0,
  tax: 0,

  addItem: (product, quantity = 1, unit = null) => {
    if (!product?.id) return false;
    const items = get().items;
    const existing = items.find((i) => i.product_id === product.id && i.unit === (unit || product.unit || 'pcs'));
    const effectiveUnit = unit || product.unit || 'pcs';

    if (existing) {
      const newQty = existing.quantity + quantity;
      if (newQty > product.stock_quantity) return false;
      set({
        items: items.map((i) =>
          i.product_id === product.id && i.unit === effectiveUnit
            ? { ...i, quantity: newQty, subtotal: newQty * i.price - (i.discount || 0) + (i.tax || 0) }
            : i
        ),
      });
    } else {
      if (quantity > product.stock_quantity) return false;
      set({
        items: [
          ...items,
          {
            product_id: product.id,
            name: product.name,
            product_code: product.product_code,
            image_url: product.image_url || '',
            price: product.selling_price,
            quantity,
            unit: effectiveUnit,
            discount: 0,
            tax: 0,
            subtotal: quantity * product.selling_price,
            stock_quantity: product.stock_quantity,
          },
        ],
      });
    }
    return true;
  },

  updateQuantity: (productId, quantity) => {
    if (quantity <= 0) {
      get().removeItem(productId);
      return;
    }
    set({
      items: get().items.map((i) =>
        i.product_id === productId
          ? { ...i, quantity, subtotal: quantity * i.price - (i.discount || 0) + (i.tax || 0) }
          : i
      ),
    });
  },

  updateDiscount: (productId, discount) => {
    set({
      items: get().items.map((i) =>
        i.product_id === productId
          ? { ...i, discount, subtotal: i.quantity * i.price - discount + (i.tax || 0) }
          : i
      ),
    });
  },

  removeItem: (productId) => {
    set({ items: get().items.filter((i) => i.product_id !== productId) });
  },

  clearCart: () => set({ items: [], discount: 0, tax: 0 }),

  getTotal: () => {
    return get().items.reduce((sum, i) => sum + i.subtotal, 0);
  },

  getItemCount: () => {
    return get().items.reduce((sum, i) => sum + i.quantity, 0);
  },
}));
