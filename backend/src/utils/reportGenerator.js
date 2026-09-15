/**
 * PROFESSIONAL SOATLIK HISOBOT GENERATORI
 * MaxPOS uchun — Telegram HTML formatidagi to'liq analitika
 *
 * Ishlatish: generateHourlyReport(stats) => Telegram HTML matn
 */

function formatMoney(num) {
  return Number(num || 0).toLocaleString('uz-UZ') + " so'm";
}

function trendIcon(percent) {
  if (percent > 0) return `🟢 +${percent}%`;
  if (percent < 0) return `🔴 ${percent}%`;
  return `⚪ 0%`;
}

function progressBar(percent, length = 10) {
  const filled = Math.round((percent / 100) * length);
  return "▓".repeat(Math.max(0, Math.min(length, filled))) + "░".repeat(Math.max(0, length - filled));
}

/**
 * stats — backend'dan keladigan ma'lumot obyekti:
 * {
 *   periodStart: "14:00", periodEnd: "15:00", date: "2026-09-15",
 *   revenue: 1250000, revenuePrevHour: 980000,
 *   orderCount: 23, orderPrevHour: 18,
 *   avgCheck: 54347,
 *   newCustomers: 3,
 *   cancelledOrders: 1,
 *   topProducts: [{name:"Osh", qty:12, sum:480000}, ...],
 *   paymentMethods: {cash: 620000, card: 630000},
 *   staffPerformance: [{name:"Alisher", sales: 450000, orders: 8}, ...],
 *   lowStock: [{name:"Guruch", left: 2, unit:"kg"}],
 *   dailyTotalSoFar: 5230000,
 *   dailyTarget: 8000000
 * }
 */
function generateHourlyReport(stats) {
  const revenueTrend = stats.revenuePrevHour
    ? Math.round(((stats.revenue - stats.revenuePrevHour) / stats.revenuePrevHour) * 100)
    : 0;
  const orderTrend = stats.orderPrevHour
    ? Math.round(((stats.orderCount - stats.orderPrevHour) / stats.orderPrevHour) * 100)
    : 0;
  const dailyProgress = stats.dailyTarget
    ? Math.round((stats.dailyTotalSoFar / stats.dailyTarget) * 100)
    : 0;

  let report = `📊 <b>SOATLIK HISOBOT</b>\n`;
  report += `🗓 ${stats.date} | ⏰ ${stats.periodStart}–${stats.periodEnd}\n`;
  report += `━━━━━━━━━━━━━━━━━━━━\n\n`;

  // Asosiy ko'rsatkichlar
  report += `💰 <b>Tushum:</b> ${formatMoney(stats.revenue)}  ${trendIcon(revenueTrend)}\n`;
  report += `🧾 <b>Buyurtmalar:</b> ${stats.orderCount} ta  ${trendIcon(orderTrend)}\n`;
  report += `💳 <b>O'rtacha chek:</b> ${formatMoney(stats.avgCheck)}\n`;
  report += `❌ <b>Bekor qilingan:</b> ${stats.cancelledOrders || 0} ta\n`;
  report += `🆕 <b>Yangi mijozlar:</b> ${stats.newCustomers || 0}\n\n`;

  // To'lov usullari
  if (stats.paymentMethods) {
    report += `💵 <b>To'lov turlari:</b>\n`;
    report += `   • Naqd: ${formatMoney(stats.paymentMethods.cash)}\n`;
    report += `   • Karta: ${formatMoney(stats.paymentMethods.card)}\n\n`;
  }

  // Top mahsulotlar
  if (stats.topProducts && stats.topProducts.length) {
    report += `🔥 <b>Eng ko'p sotilgan:</b>\n`;
    stats.topProducts.slice(0, 5).forEach((p, i) => {
      report += `   ${i + 1}. ${p.name} — ${p.qty} dona (${formatMoney(p.sum)})\n`;
    });
    report += `\n`;
  }

  // Xodimlar samaradorligi
  if (stats.staffPerformance && stats.staffPerformance.length) {
    report += `👤 <b>Xodimlar bo'yicha:</b>\n`;
    stats.staffPerformance.forEach(s => {
      report += `   • ${s.name}: ${s.orders} buyurtma — ${formatMoney(s.sales)}\n`;
    });
    report += `\n`;
  }

  // Kam qolgan mahsulotlar (ogohlantirish)
  if (stats.lowStock && stats.lowStock.length) {
    report += `⚠️ <b>Zaxira kam qolgan:</b>\n`;
    stats.lowStock.forEach(item => {
      report += `   • ${item.name}: ${item.left} ${item.unit} qoldi\n`;
    });
    report += `\n`;
  }

  // Kunlik progress
  if (stats.dailyTarget) {
    report += `🎯 <b>Kunlik reja bajarilishi:</b>\n`;
    report += `   ${progressBar(dailyProgress)} ${dailyProgress}%\n`;
    report += `   ${formatMoney(stats.dailyTotalSoFar)} / ${formatMoney(stats.dailyTarget)}\n\n`;
  }

  report += `━━━━━━━━━━━━━━━━━━━━\n`;
  report += `🤖 Avtomatik generatsiya qilindi`;

  return report;
}

module.exports = { generateHourlyReport, formatMoney, trendIcon, progressBar };
