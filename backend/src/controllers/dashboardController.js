const db = require('../config/db');

exports.get = async (req, res, next) => {
  try {
    const today = new Date().toISOString().split('T')[0];
    const isSqlite = db.isSqlite;

    const todaySales = await db.query(
      `SELECT COUNT(*) as count, COALESCE(SUM(total_amount), 0) as revenue
       FROM sales WHERE date(created_at) = date($1)`,
      [today]
    );

    const monthlySales = isSqlite
      ? await db.query(
          `SELECT COUNT(*) as count, COALESCE(SUM(total_amount), 0) as revenue
           FROM sales 
           WHERE CAST(strftime('%m', created_at) AS INTEGER) = CAST(strftime('%m', 'now') AS INTEGER)
             AND CAST(strftime('%Y', created_at) AS INTEGER) = CAST(strftime('%Y', 'now') AS INTEGER)`
        )
      : await db.query(
          `SELECT COUNT(*) as count, COALESCE(SUM(total_amount), 0) as revenue
           FROM sales 
           WHERE EXTRACT(MONTH FROM created_at) = EXTRACT(MONTH FROM NOW())
             AND EXTRACT(YEAR FROM created_at) = EXTRACT(YEAR FROM NOW())`
        );

    const productStats = await db.query(
      `SELECT 
        COUNT(*) as total,
        SUM(CASE WHEN stock_quantity < minimum_stock THEN 1 ELSE 0 END) as low_stock,
        SUM(CASE WHEN stock_quantity = 0 THEN 1 ELSE 0 END) as out_of_stock,
        COALESCE(SUM(selling_price * stock_quantity), 0) as total_inventory_value
       FROM products WHERE status = 'active'`
    );

    const totalSales = await db.query(
      `SELECT COUNT(*) as count, COALESCE(SUM(total_amount), 0) as revenue FROM sales`
    );

    const recentSales = await db.query(
      `SELECT s.*, u.name as cashier_name,
        (SELECT COUNT(*) FROM sale_items WHERE sale_id = s.id) as item_count
       FROM sales s LEFT JOIN users u ON s.user_id = u.id
       ORDER BY s.created_at DESC LIMIT 10`
    );

    const salesChart = isSqlite
      ? await db.query(
          `SELECT 
            date(created_at) as date,
            COUNT(*) as count,
            COALESCE(SUM(total_amount), 0) as revenue
           FROM sales 
           WHERE created_at >= datetime('now', '-7 days')
           GROUP BY date(created_at)
           ORDER BY date ASC`
        )
      : await db.query(
          `SELECT 
            date(created_at) as date,
            COUNT(*) as count,
            COALESCE(SUM(total_amount), 0) as revenue
           FROM sales 
           WHERE created_at >= NOW() - INTERVAL '7 days'
           GROUP BY date(created_at)
           ORDER BY date ASC`
        );

    const topProducts = await db.query(
      `SELECT p.name, COALESCE(SUM(si.quantity), 0) as sold
       FROM products p
       LEFT JOIN sale_items si ON si.product_id = p.id
       LEFT JOIN sales s ON si.sale_id = s.id AND date(s.created_at) = date($1)
       GROUP BY p.id
       HAVING COALESCE(SUM(si.quantity), 0) > 0
       ORDER BY sold DESC LIMIT 5`,
      [today]
    );

    res.json({
      today: { sales: todaySales.rows[0], date: today },
      month: monthlySales.rows[0],
      products: productStats.rows[0],
      allTime: totalSales.rows[0],
      recentSales: recentSales.rows,
      salesChart: salesChart.rows,
      topProducts: topProducts.rows,
    });
  } catch (error) {
    next(error);
  }
};
