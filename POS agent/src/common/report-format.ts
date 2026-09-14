import { formatCurrency, formatNumber } from './utils';

/** Telegram HTML uchun xavfsiz escape (<b> teglarimiz buzilmasligi uchun) */
export function escapeHtml(s: any): string {
  return String(s ?? '')
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;');
}

const MEDALS = ['🥇', '🥈', '🥉', '4️⃣', '5️⃣'];

function moodLine(hourOrders: number, hourRevenue: number): string {
  if (hourOrders === 0) return '😴 <i>Oxirgi soatda savdo bo‘lmadi — keyingi soat nasib qilsin!</i> 🍀';
  if (hourOrders >= 10 || hourRevenue >= 1000000) return '🚀 <i>Ajoyib sur’at! Shunday davom eting!</i> 🔥';
  if (hourOrders >= 4) return '📈 <i>Yaxshi ketmoqda, oldinga!</i> 💪';
  return '🐢 <i>Sekin-asta — har bir chek muhim!</i> 🤝';
}

export interface HourlyData {
  hour: string;
  hour_revenue: number;
  hour_orders: number;
  total_revenue: number;
  order_count: number;
  total_products: number;
  total_stock: number;
  low_stock: any[];
  top_products: any[];
}

export function formatHourlyHTML(d: HourlyData): string {
  const L: string[] = [];
  L.push(`⏰ <b>SOATLIK HISOBOT</b> 🕒 <b>${escapeHtml(d.hour)}</b>`);
  L.push(`━━━━━━━━━━━━━━━`);
  L.push(`⚡ <b>Oxirgi 1 soat:</b> 💰 <b>${escapeHtml(formatCurrency(d.hour_revenue))}</b> • 🧾 <b>${d.hour_orders} ta</b>`);
  L.push(``);
  L.push(`📅 <b>Bugun jami:</b>`);
  L.push(`   💰 Tushum: <b>${escapeHtml(formatCurrency(d.total_revenue))}</b>`);
  L.push(`   🧾 Cheklar: <b>${formatNumber(d.order_count)} ta</b>`);
  L.push(`   📦 Assortiment: <b>${d.total_products} xil</b> • 🏠 Omborda: <b>${formatNumber(d.total_stock)} dona</b>`);

  if (d.top_products?.length) {
    L.push(``);
    L.push(`🔥 <b>TOP-${Math.min(d.top_products.length, 5)} (bugun):</b>`);
    d.top_products.slice(0, 5).forEach((r: any, i: number) => {
      L.push(`   ${MEDALS[i] || '▫️'} ${escapeHtml(r.name)} — <b>${r.sold} dona</b>`);
    });
  } else {
    L.push(``);
    L.push(`🔥 <i>Bugun hali TOP shakllanmadi</i>`);
  }

  if (d.low_stock?.length) {
    L.push(``);
    L.push(`⚠️ <b>Kam qolganlar:</b>`);
    d.low_stock.slice(0, 5).forEach((r: any) => {
      const icon = (r.stock_quantity || 0) <= 0 ? '🔴' : '🟡';
      L.push(`   ${icon} ${escapeHtml(r.name)} — <b>${r.stock_quantity} ta</b> qoldi!`);
    });
  } else {
    L.push(``);
    L.push(`✅ <i>Omborda tanqislik yo‘q — hamma narsa joyida!</i>`);
  }

  L.push(``);
  L.push(moodLine(d.hour_orders, d.hour_revenue));
  return L.join('\n');
}

export function formatDailyHTML(d: any): string {
  const L: string[] = [];
  L.push(`🌙 <b>KUNLIK YAKUNIY HISOBOT</b> 📊`);
  L.push(`📅 <b>${escapeHtml(d.date || '')}</b>`);
  L.push(`━━━━━━━━━━━━━━━`);
  L.push(`💰 Tushum: <b>${escapeHtml(formatCurrency(d.total_revenue || 0))}</b>`);
  L.push(`🧾 Buyurtmalar: <b>${d.order_count || d.total_orders || 0} ta</b>`);
  L.push(`💳 O‘rtacha chek: <b>${escapeHtml(formatCurrency(d.avg_order || 0))}</b>`);
  if (d.unique_customers || d.active_customers) {
    L.push(`👥 Xaridorlar: <b>${d.unique_customers || d.active_customers} ta</b>`);
  }
  if (d.yesterday_revenue) {
    const diff = (d.total_revenue || 0) - (d.yesterday_revenue || 0);
    const icon = diff >= 0 ? '📈 +' : '📉 ';
    L.push(`${icon} Kechaga nisbatan: <b>${escapeHtml(formatCurrency(diff))}</b>`);
  }
  if (d.top_products?.length) {
    L.push(``);
    L.push(`🔥 <b>TOP mahsulotlar:</b>`);
    d.top_products.slice(0, 5).forEach((p: any, i: number) => {
      L.push(`   ${MEDALS[i] || '▫️'} ${escapeHtml(p.name)} — <b>${p.sold || p.total_sold} dona</b>`);
    });
  }
  if (d.low_stock?.length) {
    L.push(``);
    L.push(`⚠️ <b>Ertaga buyurtma qilish kerak:</b>`);
    d.low_stock.slice(0, 5).forEach((p: any) => {
      L.push(`   🔴 ${escapeHtml(p.name)} — <b>${p.stock_quantity} ta</b>`);
    });
  }
  L.push(``);
  L.push(`🌟 <i>Bugungi mehnatingiz uchun rahmat! Ertaga yanada zo‘r bo‘ladi!</i> 💪`);
  return L.join('\n');
}
