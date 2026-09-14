const db = require('../config/db');
const { getTashkentDate } = require('../utils/helpers');

async function safeQuery(label, queryFn) {
  try {
    return await queryFn();
  } catch (error) {
    console.error(`Dashboard query "${label}" failed:`, error.message);
    return { rows: [] };
  }
}

exports.get = async (req, res, next) => {
  try {
    const today = getTashkentDate();
    const isSqlite = db.isSqlite;
    const storeId = req.user.store_id;

    const [todaySales, monthlySales, weeklySales, yearlySales, productStats, totalSales, recentSales, salesChart, topProducts, debtStats] =
      await Promise.all([
        safeQuery('todaySales', () =>
          db.query(
            `SELECT COUNT(*) as count, COALESCE(SUM(total_amount), 0) as revenue
             FROM sales WHERE date(created_at) = date($1) AND store_id = $2`,
            [today, storeId]
          )
        ),
        safeQuery('monthlySales', () => {
          const now = new Date();
          const month = now.getMonth() + 1;
          const year = now.getFullYear();
          return isSqlite
            ? db.query(
                `SELECT COUNT(*) as count, COALESCE(SUM(total_amount), 0) as revenue
                 FROM sales
                 WHERE CAST(strftime('%m', created_at) AS INTEGER) = $1
                   AND CAST(strftime('%Y', created_at) AS INTEGER) = $2
                   AND store_id = $3`,
                [month, year, storeId]
              )
            : db.query(
                `SELECT COUNT(*) as count, COALESCE(SUM(total_amount), 0) as revenue
                 FROM sales
                 WHERE EXTRACT(MONTH FROM created_at) = $1
                   AND EXTRACT(YEAR FROM created_at) = $2
                   AND store_id = $3`,
                [month, year, storeId]
              );
        }),
        safeQuery('weeklySales', () =>
          isSqlite
            ? db.query(
                `SELECT COUNT(*) as count, COALESCE(SUM(total_amount), 0) as revenue
                 FROM sales
                 WHERE created_at >= datetime('now', '-7 days') AND store_id = $1`,
                [storeId]
              )
            : db.query(
                `SELECT COUNT(*) as count, COALESCE(SUM(total_amount), 0) as revenue
                 FROM sales
                 WHERE created_at >= NOW() - INTERVAL '7 days' AND store_id = $1`,
                [storeId]
              )
        ),
        safeQuery('yearlySales', () => {
          const year = new Date().getFullYear();
          return isSqlite
            ? db.query(
                `SELECT COUNT(*) as count, COALESCE(SUM(total_amount), 0) as revenue
                 FROM sales
                 WHERE CAST(strftime('%Y', created_at) AS INTEGER) = $1
                   AND store_id = $2`,
                [year, storeId]
              )
            : db.query(
                `SELECT COUNT(*) as count, COALESCE(SUM(total_amount), 0) as revenue
                 FROM sales
                 WHERE EXTRACT(YEAR FROM created_at) = $1
                   AND store_id = $2`,
                [year, storeId]
              );
        }),
        safeQuery('productStats', () =>
          db.query(
            `SELECT
              COUNT(*) as total,
              SUM(CASE WHEN stock_quantity < minimum_stock THEN 1 ELSE 0 END) as low_stock,
              SUM(CASE WHEN stock_quantity = 0 THEN 1 ELSE 0 END) as out_of_stock,
              COALESCE(SUM(selling_price * stock_quantity), 0) as total_inventory_value
             FROM products WHERE status = 'active' AND store_id = $1`,
            [storeId]
          )
        ),
        safeQuery('totalSales', () =>
          db.query(
            `SELECT COUNT(*) as count, COALESCE(SUM(total_amount), 0) as revenue FROM sales WHERE store_id = $1`,
            [storeId]
          )
        ),
        safeQuery('recentSales', () =>
          db.query(
            `SELECT s.*, u.name as cashier_name,
              (SELECT COUNT(*) FROM sale_items WHERE sale_id = s.id) as item_count
             FROM sales s LEFT JOIN users u ON s.user_id = u.id
             WHERE s.store_id = $1
             ORDER BY s.created_at DESC LIMIT 10`,
            [storeId]
          )
        ),
        safeQuery('salesChart', () =>
          isSqlite
            ? db.query(
                `SELECT
                  date(created_at) as date,
                  COUNT(*) as count,
                  COALESCE(SUM(total_amount), 0) as revenue
                 FROM sales
                 WHERE created_at >= datetime('now', '-7 days') AND store_id = $1
                 GROUP BY date(created_at)
                 ORDER BY date ASC`,
                [storeId]
              )
            : db.query(
                `SELECT
                  date(created_at) as date,
                  COUNT(*) as count,
                  COALESCE(SUM(total_amount), 0) as revenue
                 FROM sales
                 WHERE created_at >= NOW() - INTERVAL '7 days' AND store_id = $1
                 GROUP BY date(created_at)
                 ORDER BY date ASC`,
                [storeId]
              )
        ),
        safeQuery('topProducts', () =>
          db.query(
            `SELECT p.name, COALESCE(SUM(si.quantity), 0) as sold
             FROM products p
             LEFT JOIN sale_items si ON si.product_id = p.id
             LEFT JOIN sales s ON si.sale_id = s.id AND date(s.created_at) = date($1)
             WHERE p.store_id = $2
             GROUP BY p.id, p.name
             HAVING COALESCE(SUM(si.quantity), 0) > 0
             ORDER BY sold DESC LIMIT 5`,
            [today, storeId]
          )
        ),
        safeQuery('debtStats', () =>
          db.query(
            `SELECT COUNT(*) as total_debtors, COALESCE(SUM(debt_amount), 0) as total_debt
             FROM customers WHERE debt_status = 'has_debt' AND store_id = $1 AND debt_amount > 0`,
            [storeId]
          )
        ),
      ]);

    res.json({
      today: { sales: todaySales.rows[0] || { count: 0, revenue: 0 }, date: today },
      week: weeklySales.rows[0] || { count: 0, revenue: 0 },
      month: monthlySales.rows[0] || { count: 0, revenue: 0 },
      year: yearlySales.rows[0] || { count: 0, revenue: 0 },
      products: productStats.rows[0] || { total: 0, low_stock: 0, out_of_stock: 0, total_inventory_value: 0 },
      allTime: totalSales.rows[0] || { count: 0, revenue: 0 },
      recentSales: recentSales.rows || [],
      salesChart: salesChart.rows || [],
      topProducts: topProducts.rows || [],
      debt: debtStats.rows[0] || { total_debtors: 0, total_debt: 0 },
    });
  } catch (error) {
    next(error);
  }
};
