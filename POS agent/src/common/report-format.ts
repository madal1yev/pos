import { formatCurrency, formatNumber } from './utils';

/** Telegram HTML uchun xavfsiz escape */
export function escapeHtml(s: any): string {
  return String(s ?? '')
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;');
}

const MEDALS = ['🥇', '🥈', '🥉', '4️⃣', '5️⃣'];

function trendIcon(percent: number): string {
  if (percent > 0) return `🟢 +${percent}%`;
  if (percent < 0) return `🔴 ${percent}%`;
  return '⚪ 0%';
}

function progressBar(percent: number, length = 10): string {
  const filled = Math.round((percent / 100) * length);
  return '▓'.repeat(Math.max(0, Math.min(length, filled))) + '░'.repeat(Math.max(0, length - filled));
}

function moodLine(hourOrders: number, hourRevenue: number): string {
  if (hourOrders === 0) return '😴 <i>Oxirgi soatda savdo bo\'lmadi — keyingi soat nasib qilsin!</i> 🍀';
  if (hourOrders >= 10 || hourRevenue >= 1000000) return '🚀 <i>Ajoyib sur\'at! Shunday davom eting!</i> 🔥';
  if (hourOrders >= 4) return '📈 <i>Yaxshi ketmoqda, oldinga!</i> 💪';
  return '🐢 <i>Sekin-asta — har bir chek muhim!</i> 🤝';
}

export interface HourlyData {
  hour: string;
  hour_revenue: number;
  hour_orders: number;
  prev_hour_revenue?: number;
  prev_hour_orders?: number;
  total_revenue: number;
  order_count: number;
  avg_check?: number;
  cancelled_orders?: number;
  new_customers?: number;
  payment_methods?: { cash?: number; card?: number; other?: number };
  total_products: number;
  total_stock: number;
  low_stock: any[];
  top_products: any[];
  staff_performance?: any[];
  daily_target?: number;
}

export function formatHourlyHTML(d: HourlyData): string {
  const L: string[] = [];

  // Trend hisoblash
  const revenueTrend = d.prev_hour_revenue
    ? Math.round(((d.hour_revenue - d.prev_hour_revenue) / d.prev_hour_revenue) * 100)
    : 0;
  const orderTrend = d.prev_hour_orders
    ? Math.round(((d.hour_orders - d.prev_hour_orders) / d.prev_hour_orders) * 100)
    : 0;

  const now = new Date();
  const timeStr = now.toLocaleTimeString('uz-UZ', { hour: '2-digit', minute: '2-digit', hour12: false });
  const dateStr = now.toLocaleDateString('uz-UZ', { year: 'numeric', month: '2-digit', day: '2-digit' });

  L.push(`📊 <b>SOATLIK HISOBOT</b>`);
  L.push(`🗓 ${dateStr} | ⏰ ${timeStr}`);
  L.push(`━━━━━━━━━━━━━━━━━━━━`);
  L.push('');

  // Asosiy ko'rsatkichlar
  L.push(`💰 <b>Tushum:</b> ${escapeHtml(formatCurrency(d.hour_revenue))}  ${trendIcon(revenueTrend)}`);
  L.push(`🧾 <b>Buyurtmalar:</b> ${d.hour_orders} ta  ${trendIcon(orderTrend)}`);
  if (d.avg_check) L.push(`💳 <b>O'rtacha chek:</b> ${escapeHtml(formatCurrency(d.avg_check))}`);
  if (d.cancelled_orders !== undefined) L.push(`❌ <b>Bekor qilingan:</b> ${d.cancelled_orders} ta`);
  if (d.new_customers !== undefined) L.push(`🆕 <b>Yangi mijozlar:</b> ${d.new_customers}`);
  L.push('');

  // To'lov usullari
  if (d.payment_methods && (d.payment_methods.cash || d.payment_methods.card)) {
    L.push(`💵 <b>To'lov turlari:</b>`);
    if (d.payment_methods.cash) L.push(`   • Naqd: ${escapeHtml(formatCurrency(d.payment_methods.cash))}`);
    if (d.payment_methods.card) L.push(`   • Karta: ${escapeHtml(formatCurrency(d.payment_methods.card))}`);
    if (d.payment_methods.other) L.push(`   • Boshqa: ${escapeHtml(formatCurrency(d.payment_methods.other))}`);
    L.push('');
  }

  // TOP mahsulotlar
  if (d.top_products?.length) {
    L.push(`🔥 <b>Eng ko'p sotilgan:</b>`);
    d.top_products.slice(0, 5).forEach((r: any, i: number) => {
      L.push(`   ${MEDALS[i] || '▫️'} ${escapeHtml(r.name)} — <b>${r.sold || r.total_sold || r.qty} dona</b>`);
    });
    L.push('');
  }

  // Xodimlar samaradorligi
  if (d.staff_performance?.length) {
    L.push(`👤 <b>Xodimlar bo'yicha:</b>`);
    d.staff_performance.forEach((s: any) => {
      L.push(`   • ${escapeHtml(s.name)}: ${s.orders} buyurtma — ${escapeHtml(formatCurrency(s.sales))}`);
    });
    L.push('');
  }

  // Kam qolgan mahsulotlar
  if (d.low_stock?.length) {
    L.push(`⚠️ <b>Zaxira kam qolgan:</b>`);
    d.low_stock.slice(0, 5).forEach((r: any) => {
      const icon = (r.stock_quantity || 0) <= 0 ? '🔴' : '🟡';
      const unit = (r.stock_quantity || 0) <= 0 ? 'TUGADI' : `${r.stock_quantity} ta qoldi`;
      L.push(`   ${icon} ${escapeHtml(r.name)} — <b>${unit}</b>`);
    });
    L.push('');
  }

  // Kunlik progress
  if (d.daily_target && d.daily_target > 0) {
    const dailyProgress = Math.round((d.total_revenue / d.daily_target) * 100);
    L.push(`🎯 <b>Kunlik reja bajarilishi:</b>`);
    L.push(`   ${progressBar(dailyProgress)} ${dailyProgress}%`);
    L.push(`   ${escapeHtml(formatCurrency(d.total_revenue))} / ${escapeHtml(formatCurrency(d.daily_target))}`);
    L.push('');
  }

  // Umumiy statistika
  L.push(`📅 <b>Bugun jami:</b>`);
  L.push(`   💰 Tushum: <b>${escapeHtml(formatCurrency(d.total_revenue))}</b>`);
  L.push(`   🧾 Cheklar: <b>${formatNumber(d.order_count)} ta</b>`);
  L.push(`   📦 Assortiment: <b>${d.total_products} xil</b> • 🏠 Omborda: <b>${formatNumber(d.total_stock)} dona</b>`);
  L.push('');

  L.push(`━━━━━━━━━━━━━━━━━━━━`);
  L.push(moodLine(d.hour_orders, d.hour_revenue));
  return L.join('\n');
}

export function formatDailyHTML(d: any): string {
  const L: string[] = [];
  L.push(`🌙 <b>KUNLIK YAKUNIY HISOBOT</b> 📊`);
  L.push(`📅 <b>${escapeHtml(d.date || '')}</b>`);
  L.push(`━━━━━━━━━━━━━━━━━━━━`);
  L.push(`💰 Tushum: <b>${escapeHtml(formatCurrency(d.total_revenue || 0))}</b>`);
  L.push(`🧾 Buyurtmalar: <b>${d.order_count || d.total_orders || 0} ta</b>`);
  L.push(`💳 O'rtacha chek: <b>${escapeHtml(formatCurrency(d.avg_order || 0))}</b>`);
  if (d.unique_customers || d.active_customers) {
    L.push(`👥 Xaridorlar: <b>${d.unique_customers || d.active_customers} ta</b>`);
  }
  if (d.yesterday_revenue) {
    const diff = (d.total_revenue || 0) - (d.yesterday_revenue || 0);
    const icon = diff >= 0 ? '📈 +' : '📉 ';
    L.push(`${icon} Kechaga nisbatan: <b>${escapeHtml(formatCurrency(diff))}</b>`);
  }
  if (d.top_products?.length) {
    L.push('');
    L.push(`🔥 <b>TOP mahsulotlar:</b>`);
    d.top_products.slice(0, 5).forEach((p: any, i: number) => {
      L.push(`   ${MEDALS[i] || '▫️'} ${escapeHtml(p.name)} — <b>${p.sold || p.total_sold} dona</b>`);
    });
  }
  if (d.low_stock?.length) {
    L.push('');
    L.push(`⚠️ <b>Ertaga buyurtma qilish kerak:</b>`);
    d.low_stock.slice(0, 5).forEach((p: any) => {
      L.push(`   🔴 ${escapeHtml(p.name)} — <b>${p.stock_quantity} ta</b>`);
    });
  }
  L.push('');
  L.push(`🌟 <i>Bugungi mehnatingiz uchun rahmat! Ertaga yanada zo'r bo'ladi!</i> 💪`);
  return L.join('\n');
}
