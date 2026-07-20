const db = require('../config/db');

exports.daily = async (req, res, next) => {
  try {
    const { date } = req.query;
    const targetDate = date || new Date().toISOString().split('T')[0];

    const salesResult = await db.query(
      `SELECT s.*, u.name as cashier_name,
        (SELECT COUNT(*) FROM sale_items WHERE sale_id = s.id) as item_count
       FROM sales s LEFT JOIN users u ON s.user_id = u.id
       WHERE date(s.created_at) = date($1)
       ORDER BY s.created_at DESC`,
      [targetDate]
    );

    const summary = await db.query(
      `SELECT 
        COUNT(*) as total_sales,
        COALESCE(SUM(total_amount), 0) as total_revenue,
        COALESCE(SUM(change_amount), 0) as total_change
       FROM sales WHERE date(created_at) = date($1)`,
      [targetDate]
    );

    const paymentBreakdown = await db.query(
      `SELECT payment_method, COUNT(*) as count, COALESCE(SUM(total_amount), 0) as total
       FROM sales WHERE date(created_at) = date($1)
       GROUP BY payment_method`,
      [targetDate]
    );

    res.json({
      date: targetDate,
      summary: summary.rows[0],
      payment_breakdown: paymentBreakdown.rows,
      sales: salesResult.rows,
    });
  } catch (error) {
    next(error);
  }
};

exports.monthly = async (req, res, next) => {
  try {
    const { year, month } = req.query;
    const targetYear = year || new Date().getFullYear();
    const targetMonth = month || new Date().getMonth() + 1;
    const isSqlite = db.isSqlite;

    const monthNum = parseInt(targetMonth, 10);
    const yearNum = parseInt(targetYear, 10);

    const dailySales = isSqlite
      ? await db.query(
          `SELECT 
            date(s.created_at) as date,
            COUNT(*) as total_sales,
            COALESCE(SUM(s.total_amount), 0) as total_revenue,
            COALESCE(SUM(si.quantity), 0) as items_sold
           FROM sales s 
           LEFT JOIN sale_items si ON si.sale_id = s.id
           WHERE CAST(strftime('%m', s.created_at) AS INTEGER) = $1 
             AND CAST(strftime('%Y', s.created_at) AS INTEGER) = $2
           GROUP BY DATE(s.created_at)
           ORDER BY date ASC`,
          [monthNum, yearNum]
        )
      : await db.query(
          `SELECT 
            date(s.created_at) as date,
            COUNT(*) as total_sales,
            COALESCE(SUM(s.total_amount), 0) as total_revenue,
            COALESCE(SUM(si.quantity), 0) as items_sold
           FROM sales s 
           LEFT JOIN sale_items si ON si.sale_id = s.id
           WHERE EXTRACT(MONTH FROM s.created_at) = $1 
             AND EXTRACT(YEAR FROM s.created_at) = $2
           GROUP BY DATE(s.created_at)
           ORDER BY date ASC`,
          [monthNum, yearNum]
        );

    const monthlySummary = isSqlite
      ? await db.query(
          `SELECT 
            COUNT(*) as total_sales,
            COALESCE(SUM(total_amount), 0) as total_revenue,
            COALESCE(SUM(total_amount - change_amount), 0) as net_revenue
           FROM sales 
           WHERE CAST(strftime('%m', created_at) AS INTEGER) = $1 
             AND CAST(strftime('%Y', created_at) AS INTEGER) = $2`,
          [monthNum, yearNum]
        )
      : await db.query(
          `SELECT 
            COUNT(*) as total_sales,
            COALESCE(SUM(total_amount), 0) as total_revenue,
            COALESCE(SUM(total_amount - change_amount), 0) as net_revenue
           FROM sales 
           WHERE EXTRACT(MONTH FROM created_at) = $1 
             AND EXTRACT(YEAR FROM created_at) = $2`,
          [monthNum, yearNum]
        );

    res.json({
      year: yearNum,
      month: monthNum,
      summary: monthlySummary.rows[0],
      daily_sales: dailySales.rows,
    });
  } catch (error) {
    next(error);
  }
};

exports.topProducts = async (req, res, next) => {
  try {
    const { limit = 10, from_date, to_date } = req.query;

    let dateFilter = '1=1';
    let params = [];

    if (from_date && to_date) {
      dateFilter = `date(s.created_at) >= date($1) AND date(s.created_at) <= date($2)`;
      params = [from_date, to_date];
    } else if (from_date) {
      dateFilter = `date(s.created_at) >= date($1)`;
      params = [from_date];
    } else if (to_date) {
      dateFilter = `date(s.created_at) <= date($1)`;
      params = [to_date];
    }

    const result = await db.query(
      `SELECT 
        p.id, p.name, p.product_code, p.brand, p.selling_price,
        COALESCE(SUM(si.quantity), 0) as total_sold,
        COALESCE(SUM(si.subtotal), 0) as total_revenue,
        COUNT(DISTINCT si.sale_id) as sale_count
       FROM products p
       LEFT JOIN sale_items si ON si.product_id = p.id
       LEFT JOIN sales s ON si.sale_id = s.id AND ${dateFilter}
       GROUP BY p.id
       HAVING COALESCE(SUM(si.quantity), 0) > 0
       ORDER BY total_sold DESC
       LIMIT $${params.length + 1}`,
      [...params, parseInt(limit)]
    );

    res.json({ top_products: result.rows });
  } catch (error) {
    next(error);
  }
};

exports.inventory = async (req, res, next) => {
  try {
    const { low_stock } = req.query;

    let where = "p.status = 'active'";
    if (low_stock === 'true') {
      where += ' AND p.stock_quantity <= p.minimum_stock';
    }

    const result = await db.query(
      `SELECT p.*, c.name as category_name,
        (p.selling_price - p.purchase_price) as profit_margin,
        (p.selling_price * p.stock_quantity) as stock_value
       FROM products p
       LEFT JOIN categories c ON p.category_id = c.id
       WHERE ${where}
       ORDER BY p.stock_quantity ASC`
    );

    const summary = await db.query(
      `SELECT 
        COUNT(*) as total_products,
        COALESCE(SUM(stock_quantity), 0) as total_stock,
        COALESCE(SUM(selling_price * stock_quantity), 0) as total_stock_value,
        COALESCE(SUM(purchase_price * stock_quantity), 0) as total_cost_value,
        SUM(CASE WHEN stock_quantity <= minimum_stock THEN 1 ELSE 0 END) as low_stock_count,
        SUM(CASE WHEN stock_quantity = 0 THEN 1 ELSE 0 END) as out_of_stock_count
       FROM products WHERE status = 'active'`
    );

    res.json({ summary: summary.rows[0], products: result.rows });
  } catch (error) {
    next(error);
  }
};

exports.revenue = async (req, res, next) => {
  try {
    const { period = 'daily', from_date, to_date } = req.query;
    const isSqlite = db.isSqlite;

    let groupBy, dateFormat;

    if (isSqlite) {
      switch (period) {
        case 'weekly':
          groupBy = "strftime('%Y-W%W', s.created_at)";
          dateFormat = "strftime('%Y-W%W', s.created_at)";
          break;
        case 'monthly':
          groupBy = "strftime('%Y-%m', s.created_at)";
          dateFormat = "strftime('%Y-%m', s.created_at)";
          break;
        default:
          groupBy = "date(s.created_at)";
          dateFormat = "date(s.created_at)";
      }
    } else {
      switch (period) {
        case 'weekly':
          groupBy = "TO_CHAR(s.created_at, 'IYYY-\"W\"IW')";
          dateFormat = "TO_CHAR(s.created_at, 'IYYY-\"W\"IW')";
          break;
        case 'monthly':
          groupBy = "TO_CHAR(s.created_at, 'YYYY-MM')";
          dateFormat = "TO_CHAR(s.created_at, 'YYYY-MM')";
          break;
        default:
          groupBy = "date(s.created_at)";
          dateFormat = "date(s.created_at)";
      }
    }

    let where = ['1=1'];
    let params = [];
    let paramCount = 0;

    if (from_date) {
      paramCount++;
      where.push(`date(s.created_at) >= date($${paramCount})`);
      params.push(from_date);
    }

    if (to_date) {
      paramCount++;
      where.push(`date(s.created_at) <= date($${paramCount})`);
      params.push(to_date);
    }

    const result = await db.query(
      `SELECT ${dateFormat} as period,
        COUNT(*) as total_sales,
        COALESCE(SUM(s.total_amount), 0) as total_revenue
       FROM sales s
       WHERE ${where.join(' AND ')}
       GROUP BY ${groupBy}
       ORDER BY ${groupBy} ASC`,
      params
    );

    res.json({ period, data: result.rows });
  } catch (error) {
    next(error);
  }
};
