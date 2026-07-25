import { create } from 'zustand';
import { productsAPI } from '../services/api';

const loadCart = () => {
  try {
    const saved = localStorage.getItem('pos_cart');
    return saved ? JSON.parse(saved) : [];
  } catch { return []; }
};

const loadHeldOrders = () => {
  try {
    const saved = localStorage.getItem('pos_held_orders');
    return saved ? JSON.parse(saved) : [];
  } catch { return []; }
};

const saveCart = (items) => {
  try { localStorage.setItem('pos_cart', JSON.stringify(items)); } catch {}
};

const saveHeldOrders = (orders) => {
  try { localStorage.setItem('pos_held_orders', JSON.stringify(orders)); } catch {}
};

export const useCartStore = create((set, get) => ({
  items: loadCart(),
  discount: 0,
  tax: 0,
  heldOrders: loadHeldOrders(),
  currentHoldId: null,

  addItem: (product, quantity = 1, unit = null) => {
    if (!product?.id) return false;
    const items = get().items;
    const effectiveUnit = unit || product.unit || 'pcs';
    const existing = items.find((i) => i.product_id === product.id && i.unit === effectiveUnit);

    if (existing) {
      const newQty = existing.quantity + quantity;
      if (newQty > product.stock_quantity) return false;
      const next = items.map((i) =>
        i.product_id === product.id && i.unit === effectiveUnit
          ? { ...i, quantity: newQty, subtotal: newQty * i.price - (i.discount || 0) + (i.tax || 0) }
          : i
      );
      set({ items: next });
      saveCart(next);
    } else {
      if (quantity > product.stock_quantity) return false;
      const next = [
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
      ];
      set({ items: next });
      saveCart(next);
    }
    return true;
  },

  updateQuantity: (productId, quantity) => {
    if (quantity <= 0) {
      get().removeItem(productId);
      return;
    }
    const next = get().items.map((i) =>
      i.product_id === productId
        ? { ...i, quantity, subtotal: quantity * i.price - (i.discount || 0) + (i.tax || 0) }
        : i
    );
    set({ items: next });
    saveCart(next);
  },

  updateDiscount: (productId, discount) => {
    const next = get().items.map((i) =>
      i.product_id === productId
        ? { ...i, discount, subtotal: i.quantity * i.price - discount + (i.tax || 0) }
        : i
    );
    set({ items: next });
    saveCart(next);
  },

  removeItem: (productId) => {
    const next = get().items.filter((i) => i.product_id !== productId);
    set({ items: next });
    saveCart(next);
  },

  clearCart: () => {
    set({ items: [], discount: 0, tax: 0, currentHoldId: null });
    saveCart([]);
  },

  holdOrder: (name = '') => {
    const { items, discount, tax, heldOrders, currentHoldId } = get();
    if (items.length === 0) return null;
    const holdId = currentHoldId || `hold_${Date.now()}`;
    const order = {
      id: holdId,
      name: name || `Buyurtma #${heldOrders.length + 1}`,
      items: [...items],
      discount,
      tax,
      total: get().getTotal(),
      heldAt: new Date().toISOString(),
    };
    const nextHeld = currentHoldId
      ? heldOrders.map((h) => (h.id === currentHoldId ? order : h))
      : [...heldOrders, order];
    set({ items: [], discount: 0, tax: 0, heldOrders: nextHeld, currentHoldId: null });
    saveCart([]);
    saveHeldOrders(nextHeld);
    return holdId;
  },

  resumeOrder: (holdId) => {
    const { heldOrders } = get();
    const order = heldOrders.find((h) => h.id === holdId);
    if (!order) return false;
    set({
      items: order.items,
      discount: order.discount || 0,
      tax: order.tax || 0,
      currentHoldId: holdId,
    });
    saveCart(order.items);
    return true;
  },

  removeHeldOrder: (holdId) => {
    const next = get().heldOrders.filter((h) => h.id !== holdId);
    set({ heldOrders: next });
    saveHeldOrders(next);
  },

  getTotal: () => {
    return get().items.reduce((sum, i) => sum + i.subtotal, 0);
  },

  getItemCount: () => {
    return get().items.reduce((sum, i) => sum + i.quantity, 0);
  },
}));
