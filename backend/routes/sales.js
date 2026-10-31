const express = require('express');
const router = express.Router();
const pool = require('../config/database');

// GET all sales orders with items
router.get('/', async (req, res) => {
  try {
    const [orders] = await pool.query('SELECT * FROM sales_orders ORDER BY order_date DESC, id DESC');
    for (const order of orders) {
      const [items] = await pool.query('SELECT * FROM sales_order_items WHERE sales_order_id = ?', [order.id]);
      order.items = items;
    }
    res.json(orders);
  } catch (err) { res.status(500).json({ error: err.message }); }
});

// GET single sales order
router.get('/:id', async (req, res) => {
  try {
    const [orders] = await pool.query('SELECT * FROM sales_orders WHERE id = ?', [req.params.id]);
    const order = orders[0];
    if (!order) return res.status(404).json({ error: 'Not found' });
    const [items] = await pool.query('SELECT * FROM sales_order_items WHERE sales_order_id = ?', [order.id]);
    order.items = items;
    res.json(order);
  } catch (err) { res.status(500).json({ error: err.message }); }
});

// POST create sales order
router.post('/', async (req, res) => {
  const conn = await pool.getConnection();
  try {
    const { order_no, customer_id, order_date, items, remark } = req.body;
    await conn.beginTransaction();
    const [result] = await conn.query('INSERT INTO sales_orders (order_no, customer_id, order_date, remark) VALUES (?, ?, ?, ?)',
      [order_no, customer_id || null, order_date, remark || '']);
    const orderId = result.insertId;
    let totalIncome = 0, totalCost = 0;
    for (const item of items) {
      const income = (item.quantity || 0) * (item.actual_sale_price || item.ref_sale_price || 0);
      const cost = (item.quantity || 0) * (item.cost_price || 0);
      totalIncome += income;
      totalCost += cost;
      await conn.query(
        'INSERT INTO sales_order_items (sales_order_id, product_id, product_code, product_name, unit, quantity, ref_sale_price, ref_income, actual_sale_price, actual_income, cost_price, cost_amount, profit, remark) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)',
        [orderId, item.product_id, item.product_code, item.product_name, item.unit, item.quantity, item.ref_sale_price,
         (item.quantity || 0) * (item.ref_sale_price || 0), item.actual_sale_price || item.ref_sale_price, income,
         item.cost_price || 0, cost, income - cost, item.remark || '']
      );
    }
    await conn.query('UPDATE sales_orders SET total_income=?, total_cost=?, total_profit=? WHERE id=?',
      [totalIncome, totalCost, totalIncome - totalCost, orderId]);
    await conn.commit();
    res.json({ id: orderId, message: 'Created' });
  } catch (err) {
    await conn.rollback();
    res.status(500).json({ error: err.message });
  } finally { conn.release(); }
});

// DELETE sales order
router.delete('/:id', async (req, res) => {
  const conn = await pool.getConnection();
  try {
    await conn.beginTransaction();
    await conn.query('DELETE FROM sales_order_items WHERE sales_order_id = ?', [req.params.id]);
    await conn.query('DELETE FROM sales_orders WHERE id = ?', [req.params.id]);
    await conn.commit();
    res.json({ message: 'Deleted' });
  } catch (err) {
    await conn.rollback();
    res.status(500).json({ error: err.message });
  } finally { conn.release(); }
});

module.exports = router;
