const express = require('express');
const router = express.Router();
const pool = require('../config/database');

// GET all purchase orders with items
router.get('/', async (req, res) => {
  try {
    const [orders] = await pool.query('SELECT * FROM purchase_orders ORDER BY order_date DESC, id DESC');
    for (const order of orders) {
      const [items] = await pool.query('SELECT * FROM purchase_order_items WHERE purchase_order_id = ?', [order.id]);
      order.items = items;
    }
    res.json(orders);
  } catch (err) { res.status(500).json({ error: err.message }); }
});

// GET single purchase order
router.get('/:id', async (req, res) => {
  try {
    const [orders] = await pool.query('SELECT * FROM purchase_orders WHERE id = ?', [req.params.id]);
    const order = orders[0];
    if (!order) return res.status(404).json({ error: 'Not found' });
    const [items] = await pool.query('SELECT * FROM purchase_order_items WHERE purchase_order_id = ?', [order.id]);
    order.items = items;
    res.json(order);
  } catch (err) { res.status(500).json({ error: err.message }); }
});

// POST create purchase order
router.post('/', async (req, res) => {
  const conn = await pool.getConnection();
  try {
    const { order_no, supplier_id, order_date, items, remark } = req.body;
    await conn.beginTransaction();
    const [result] = await conn.query('INSERT INTO purchase_orders (order_no, supplier_id, order_date, remark) VALUES (?, ?, ?, ?)',
      [order_no, supplier_id || null, order_date, remark || '']);
    const orderId = result.insertId;
    let totalAmount = 0;
    for (const item of items) {
      const amount = (item.quantity || 0) * (item.ref_purchase_price || 0);
      const actualAmount = (item.quantity || 0) * (item.actual_purchase_price || item.ref_purchase_price || 0);
      totalAmount += actualAmount;
      await conn.query(
        'INSERT INTO purchase_order_items (purchase_order_id, product_id, product_code, product_name, unit, quantity, ref_purchase_price, amount, actual_purchase_price, actual_amount, remark) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)',
        [orderId, item.product_id, item.product_code, item.product_name, item.unit, item.quantity, item.ref_purchase_price, amount, item.actual_purchase_price || item.ref_purchase_price, actualAmount, item.remark || '']
      );
    }
    await conn.query('UPDATE purchase_orders SET total_amount = ? WHERE id = ?', [totalAmount, orderId]);
    await conn.commit();
    res.json({ id: orderId, message: 'Created' });
  } catch (err) {
    await conn.rollback();
    res.status(500).json({ error: err.message });
  } finally { conn.release(); }
});

// PUT update purchase order
router.put('/:id', async (req, res) => {
  const conn = await pool.getConnection();
  try {
    const { supplier_id, order_date, items, remark } = req.body;
    await conn.beginTransaction();
    await conn.query('UPDATE purchase_orders SET supplier_id=?, order_date=?, remark=? WHERE id=?',
      [supplier_id || null, order_date, remark || '', req.params.id]);
    await conn.query('DELETE FROM purchase_order_items WHERE purchase_order_id = ?', [req.params.id]);
    let totalAmount = 0;
    for (const item of items) {
      const actualAmount = (item.quantity || 0) * (item.actual_purchase_price || item.ref_purchase_price || 0);
      totalAmount += actualAmount;
      await conn.query(
        'INSERT INTO purchase_order_items (purchase_order_id, product_id, product_code, product_name, unit, quantity, ref_purchase_price, amount, actual_purchase_price, actual_amount, remark) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)',
        [req.params.id, item.product_id, item.product_code, item.product_name, item.unit, item.quantity, item.ref_purchase_price,
         (item.quantity || 0) * (item.ref_purchase_price || 0), item.actual_purchase_price || item.ref_purchase_price, actualAmount, item.remark || '']
      );
    }
    await conn.query('UPDATE purchase_orders SET total_amount = ? WHERE id = ?', [totalAmount, req.params.id]);
    await conn.commit();
    res.json({ message: 'Updated' });
  } catch (err) {
    await conn.rollback();
    res.status(500).json({ error: err.message });
  } finally { conn.release(); }
});

// DELETE purchase order
router.delete('/:id', async (req, res) => {
  const conn = await pool.getConnection();
  try {
    await conn.beginTransaction();
    await conn.query('DELETE FROM purchase_order_items WHERE purchase_order_id = ?', [req.params.id]);
    await conn.query('DELETE FROM purchase_orders WHERE id = ?', [req.params.id]);
    await conn.commit();
    res.json({ message: 'Deleted' });
  } catch (err) {
    await conn.rollback();
    res.status(500).json({ error: err.message });
  } finally { conn.release(); }
});

module.exports = router;
