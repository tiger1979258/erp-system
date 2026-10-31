const express = require('express');
const router = express.Router();
const pool = require('../config/database');

// GET all production orders with materials
router.get('/', async (req, res) => {
  try {
    const [orders] = await pool.query('SELECT po.*, p.product_name as finished_name FROM production_orders po LEFT JOIN products p ON po.product_id = p.id ORDER BY po.id DESC');
    for (const order of orders) {
      const [materials] = await pool.query('SELECT * FROM production_materials WHERE production_order_id = ?', [order.id]);
      order.materials = materials;
    }
    res.json(orders);
  } catch (err) { res.status(500).json({ error: err.message }); }
});

// GET single production order
router.get('/:id', async (req, res) => {
  try {
    const [orders] = await pool.query('SELECT * FROM production_orders WHERE id = ?', [req.params.id]);
    const order = orders[0];
    if (!order) return res.status(404).json({ error: 'Not found' });
    const [materials] = await pool.query('SELECT * FROM production_materials WHERE production_order_id = ?', [order.id]);
    order.materials = materials;
    res.json(order);
  } catch (err) { res.status(500).json({ error: err.message }); }
});

// POST create production order
router.post('/', async (req, res) => {
  const conn = await pool.getConnection();
  try {
    const { order_no, product_id, product_code, product_name, plan_quantity, plan_start_date, plan_end_date, materials, remark } = req.body;
    const [result] = await conn.query(
      'INSERT INTO production_orders (order_no, product_id, product_code, product_name, plan_quantity, plan_start_date, plan_end_date, remark) VALUES (?, ?, ?, ?, ?, ?, ?, ?)',
      [order_no, product_id, product_code, product_name, plan_quantity, plan_start_date, plan_end_date, remark || '']
    );
    const orderId = result.insertId;
    for (const mat of materials || []) {
      await conn.query(
        'INSERT INTO production_materials (production_order_id, product_id, product_code, product_name, unit, plan_quantity, actual_quantity, remark) VALUES (?, ?, ?, ?, ?, ?, ?, ?)',
        [orderId, mat.product_id, mat.product_code, mat.product_name, mat.unit, mat.plan_quantity, mat.actual_quantity || 0, mat.remark || '']
      );
    }
    await conn.commit();
    res.json({ id: orderId, message: 'Created' });
  } catch (err) {
    await conn.rollback();
    res.status(500).json({ error: err.message });
  } finally { conn.release(); }
});

// PUT update production order
router.put('/:id', async (req, res) => {
  const conn = await pool.getConnection();
  try {
    const { product_id, product_code, product_name, plan_quantity, actual_quantity, status, plan_start_date, plan_end_date, actual_start_date, actual_end_date, materials, remark } = req.body;
    await conn.beginTransaction();
    await conn.query(
      'UPDATE production_orders SET product_id=?, product_code=?, product_name=?, plan_quantity=?, actual_quantity=?, status=?, plan_start_date=?, plan_end_date=?, actual_start_date=?, actual_end_date=?, remark=? WHERE id=?',
      [product_id, product_code, product_name, plan_quantity, actual_quantity || 0, status, plan_start_date, plan_end_date, actual_start_date, actual_end_date, remark || '', req.params.id]
    );
    await conn.query('DELETE FROM production_materials WHERE production_order_id = ?', [req.params.id]);
    for (const mat of materials || []) {
      await conn.query(
        'INSERT INTO production_materials (production_order_id, product_id, product_code, product_name, unit, plan_quantity, actual_quantity, remark) VALUES (?, ?, ?, ?, ?, ?, ?, ?)',
        [req.params.id, mat.product_id, mat.product_code, mat.product_name, mat.unit, mat.plan_quantity, mat.actual_quantity || 0, mat.remark || '']
      );
    }
    await conn.commit();
    res.json({ message: 'Updated' });
  } catch (err) {
    await conn.rollback();
    res.status(500).json({ error: err.message });
  } finally { conn.release(); }
});

// DELETE production order
router.delete('/:id', async (req, res) => {
  const conn = await pool.getConnection();
  try {
    await conn.beginTransaction();
    await conn.query('DELETE FROM production_materials WHERE production_order_id = ?', [req.params.id]);
    await conn.query('DELETE FROM production_orders WHERE id = ?', [req.params.id]);
    await conn.commit();
    res.json({ message: 'Deleted' });
  } catch (err) {
    await conn.rollback();
    res.status(500).json({ error: err.message });
  } finally { conn.release(); }
});

module.exports = router;
