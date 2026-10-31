const express = require('express');
const router = express.Router();
const pool = require('../config/database');

// GET dashboard overview stats
router.get('/overview', async (req, res) => {
  try {
    // Inventory stats
    const [invStats] = await pool.query(`
      SELECT
        COUNT(DISTINCT p.id) as total_products,
        SUM(CASE WHEN (SELECT COALESCE(SUM(quantity),0) FROM purchase_order_items WHERE product_id = p.id) - (SELECT COALESCE(SUM(quantity),0) FROM sales_order_items WHERE product_id = p.id) <= 0 THEN 1 ELSE 0 END) as out_of_stock,
        SUM(CASE WHEN (SELECT COALESCE(SUM(quantity),0) FROM purchase_order_items WHERE product_id = p.id) - (SELECT COALESCE(SUM(quantity),0) FROM sales_order_items WHERE product_id = p.id) BETWEEN 1 AND p.safe_stock THEN 1 ELSE 0 END) as low_stock
      FROM products p
    `);

    // Sales stats (this month)
    const [salesStats] = await pool.query(`
      SELECT COALESCE(SUM(total_income),0) as month_income, COALESCE(SUM(total_profit),0) as month_profit,
             COUNT(*) as order_count FROM sales_orders WHERE DATE_FORMAT(order_date, '%Y-%m') = DATE_FORMAT(NOW(), '%Y-%m')
    `);

    // Purchase stats
    const [purchaseStats] = await pool.query(`
      SELECT COALESCE(SUM(total_amount),0) as month_purchase FROM purchase_orders WHERE DATE_FORMAT(order_date, '%Y-%m') = DATE_FORMAT(NOW(), '%Y-%m')
    `);

    // Finance stats
    const [financeStats] = await pool.query(`
      SELECT
        (SELECT COALESCE(SUM(amount),0) FROM finance_records WHERE record_type='income' AND DATE_FORMAT(record_date, '%Y-%m') = DATE_FORMAT(NOW(), '%Y-%m')) as month_finance_income,
        (SELECT COALESCE(SUM(amount),0) FROM finance_records WHERE record_type='expense' AND DATE_FORMAT(record_date, '%Y-%m') = DATE_FORMAT(NOW(), '%Y-%m')) as month_finance_expense
    `);

    // Production stats
    const [prodStats] = await pool.query(`
      SELECT COUNT(*) as pending_orders FROM production_orders WHERE status IN ('pending', 'in_progress')
    `);

    res.json({
      inventory: invStats[0],
      sales: salesStats[0],
      purchase: purchaseStats[0],
      finance: financeStats[0],
      production: prodStats[0]
    });
  } catch (err) { res.status(500).json({ error: err.message }); }
});

// GET inventory detail for dashboard
router.get('/inventory', async (req, res) => {
  try {
    const [rows] = await pool.query(`
      SELECT p.id, p.product_code, p.product_name, p.category, p.unit, p.safe_stock,
        COALESCE((SELECT SUM(quantity) FROM purchase_order_items WHERE product_id = p.id),0) as total_in,
        COALESCE((SELECT SUM(quantity) FROM sales_order_items WHERE product_id = p.id),0) as total_out,
        COALESCE((SELECT SUM(quantity) FROM purchase_order_items WHERE product_id = p.id),0) - COALESCE((SELECT SUM(quantity) FROM sales_order_items WHERE product_id = p.id),0) as current_stock,
        p.purchase_price, p.sale_price
      FROM products p ORDER BY p.id
    `);
    res.json(rows);
  } catch (err) { res.status(500).json({ error: err.message }); }
});

module.exports = router;
