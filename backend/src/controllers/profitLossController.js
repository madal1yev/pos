const db = require('../config/db');

exports.getReport = async (req, res, next) => {
  try {
    const { from_date, to_date, period = 'daily' } = req.query;
    const isSqlite = db.isSqlite;

    let dateFilter = '1=1';
    let params = [];
    let paramCount = 0;

    if (from_date) {
      paramCount++;
      dateFilter += ` AND date(s.created_at) >= date($${paramCount})`;
      params.push(from_date);
    }
    if (to_date) {
      paramCount++;
      dateFilter += ` AND date(s.created_at) <= date($${paramCount})`;
      params.push(to_date);
    }

    let groupBy, dateFormat;
    if (isSqlite) {
      switch (period) {
        case 'monthly':
          groupBy = "strftime('%Y-%m', s.created_at)";
          dateFormat = "strftime('%Y-%m', s.created_at)";
          break;
        case 'weekly':
          groupBy = "strftime('%Y-W%W', s.created_at)";
          dateFormat = "strftime('%Y-W%W', s.created_at)";
          break;
        default:
          groupBy = "date(s.created_at)";
          dateFormat = "date(s.created_at)";
      }
    } else {
      switch (period) {
        case 'monthly':
          groupBy = "TO_CHAR(s.created_at, 'YYYY-MM')";
          dateFormat = "TO_CHAR(s.created_at, 'YYYY-MM')";
          break;
        case 'weekly':
          groupBy = "TO_CHAR(s.created_at, 'IYYY-\"W\"IW')";
          dateFormat = "TO_CHAR(s.created_at, 'IYYY-\"W\"IW')";
          break;
        default:
          groupBy = "date(s.created_at)";
          dateFormat = "date(s.created_at)";
      }
    }

    // Main profit/loss query
    const profitData = await db.query(
      `SELECT
        ${dateFormat} as period,
        COUNT(DISTINCT s.id) as total_sales,
        COALESCE(SUM(s.total_amount), 0) as total_revenue,
        COALESCE(SUM(si.quantity * p.purchase_price), 0) as total_cost,
        COALESCE(SUM(s.total_amount), 0) - COALESCE(SUM(si.quantity * p.purchase_price), 0) as gross_profit,
        COALESCE(SUM(si.discount), 0) as total_discounts
       FROM sales s
       JOIN sale_items si ON si.sale_id = s.id
       JOIN products p ON si.product_id = p.id
       WHERE ${dateFilter} AND s.sale_type != 'refund'
       GROUP BY ${groupBy}
       ORDER BY period ASC`,
      params
    );

    // Refund totals
    const refundData = await db.query(
      `SELECT
        ${dateFormat} as period,
        COALESCE(SUM(r.refund_amount), 0) as total_refunds,
        COUNT(*) as refund_count
       FROM refunds r
       JOIN sales s ON r.sale_id = s.id
       WHERE ${dateFilter}
       GROUP BY ${groupBy}
       ORDER BY period ASC`,
      params
    );

    // Merge refund data
    const refundMap = {};
    for (const r of refundData.rows) {
      refundMap[r.period] = { refunds: r.total_refunds, count: r.refund_count };
    }

    const reportData = profitData.rows.map(row => {
      const ref = refundMap[row.period] || { refunds: 0, count: 0 };
      return {
        period: row.period,
        total_sales: parseInt(row.total_sales),
        total_revenue: parseFloat(row.total_revenue),
        total_cost: parseFloat(row.total_cost),
        gross_profit: parseFloat(row.gross_profit),
        profit_margin: parseFloat(row.total_revenue) > 0
          ? ((parseFloat(row.gross_profit) / parseFloat(row.total_revenue)) * 100).toFixed(1)
          : '0.0',
        total_discounts: parseFloat(row.total_discounts),
        total_refunds: parseFloat(ref.refunds),
        net_profit: parseFloat(row.gross_profit) - parseFloat(ref.refunds),
        refund_count: ref.count,
      };
    });

    // Summary
    const summary = await db.query(
      `SELECT
        COALESCE(SUM(s.total_amount), 0) as total_revenue,
        COALESCE(SUM(si.quantity * p.purchase_price), 0) as total_cost,
        COALESCE(SUM(s.total_amount), 0) - COALESCE(SUM(si.quantity * p.purchase_price), 0) as gross_profit,
        COALESCE(SUM(si.discount), 0) as total_discounts,
        (SELECT COALESCE(SUM(refund_amount), 0) FROM refunds r JOIN sales s2 ON r.sale_id = s2.id WHERE ${dateFilter.replace(/s\./g, 's2.')}) as total_refunds
       FROM sales s
       JOIN sale_items si ON si.sale_id = s.id
       JOIN products p ON si.product_id = p.id
       WHERE ${dateFilter} AND s.sale_type != 'refund'`,
      params
    );

    // Top profitable products
    const topProducts = await db.query(
      `SELECT
        p.id, p.name, p.product_code,
        SUM(si.quantity) as total_sold,
        SUM(si.subtotal) as total_revenue,
        SUM(si.quantity * p.purchase_price) as total_cost,
        SUM(si.subtotal) - SUM(si.quantity * p.purchase_price) as total_profit
       FROM sale_items si
       JOIN products p ON si.product_id = p.id
       JOIN sales s ON si.sale_id = s.id
       WHERE ${dateFilter}
       GROUP BY p.id, p.name, p.product_code
       HAVING SUM(si.quantity) > 0
       ORDER BY total_profit DESC
       LIMIT 15`,
      params
    );

    const s = summary.rows[0] || {};
    const totalRefunds = parseFloat(s.total_refunds || 0);

    res.json({
      report: reportData,
      summary: {
        total_revenue: parseFloat(s.total_revenue || 0),
        total_cost: parseFloat(s.total_cost || 0),
        gross_profit: parseFloat(s.gross_profit || 0),
        profit_margin: parseFloat(s.total_revenue) > 0
          ? ((parseFloat(s.gross_profit || 0) / parseFloat(s.total_revenue || 0)) * 100).toFixed(1)
          : '0.0',
        total_discounts: parseFloat(s.total_discounts || 0),
        total_refunds: totalRefunds,
        net_profit: parseFloat(s.gross_profit || 0) - totalRefunds,
      },
      top_products: topProducts.rows,
    });
  } catch (error) {
    next(error);
  }
};

// Product-level profit analysis
exports.getProductProfit = async (req, res, next) => {
  try {
    const { from_date, to_date } = req.query;
    let dateFilter = '1=1';
    let params = [];
    let paramCount = 0;

    if (from_date) {
      paramCount++;
      dateFilter += ` AND date(s.created_at) >= date($${paramCount})`;
      params.push(from_date);
    }
    if (to_date) {
      paramCount++;
      dateFilter += ` AND date(s.created_at) <= date($${paramCount})`;
      params.push(to_date);
    }

    const result = await db.query(
      `SELECT
        p.id, p.name, p.product_code, p.category_id, c.name as category_name,
        p.purchase_price, p.selling_price,
        (p.selling_price - p.purchase_price) as unit_profit,
        CASE WHEN p.purchase_price > 0
          THEN ROUND((p.selling_price - p.purchase_price) * 100.0 / NULLIF(p.purchase_price, 0), 1)
          ELSE 0 END as margin_percent,
        COALESCE(SUM(si.quantity), 0) as total_sold,
        COALESCE(SUM(si.subtotal), 0) as total_revenue,
        COALESCE(SUM(si.quantity * p.purchase_price), 0) as total_cost,
        COALESCE(SUM(si.subtotal) - SUM(si.quantity * p.purchase_price), 0) as total_profit
       FROM products p
       LEFT JOIN categories c ON p.category_id = c.id
       LEFT JOIN sale_items si ON si.product_id = p.id
       LEFT JOIN sales s ON si.sale_id = s.id AND ${dateFilter}
       WHERE p.status = 'active'
       GROUP BY p.id, p.name, p.product_code, p.category_id, c.name, p.purchase_price, p.selling_price
       ORDER BY total_profit DESC`,
      params
    );

    res.json({ products: result.rows });
  } catch (error) {
    next(error);
  }
};
