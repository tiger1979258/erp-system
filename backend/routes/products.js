const express = require('express');
const router = express.Router();
const pool = require('../config/database');

// GET all products
router.get('/', async (req, res) => {
  try {
    const [rows] = await pool.query('SELECT * FROM products ORDER BY id');
    res.json(rows);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// GET single product
router.get('/:id', async (req, res) => {
  try {
    const [rows] = await pool.query('SELECT * FROM products WHERE id = ?', [req.params.id]);
    res.json(rows[0] || null);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// POST create product
router.post('/', async (req, res) => {
  try {
    const { product_code, product_name, category, unit, purchase_price, sale_price, safe_stock, remark } = req.body;
    const [result] = await pool.query(
      'INSERT INTO products (product_code, product_name, category, unit, purchase_price, sale_price, safe_stock, remark) VALUES (?, ?, ?, ?, ?, ?, ?, ?)',
      [product_code, product_name, category, unit, purchase_price, sale_price, safe_stock, remark]
    );
    res.json({ id: result.insertId, message: 'Created' });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// PUT update product
router.put('/:id', async (req, res) => {
  try {
    const { product_name, category, unit, purchase_price, sale_price, safe_stock, remark } = req.body;
    await pool.query(
      'UPDATE products SET product_name=?, category=?, unit=?, purchase_price=?, sale_price=?, safe_stock=?, remark=? WHERE id=?',
      [product_name, category, unit, purchase_price, sale_price, safe_stock, remark, req.params.id]
    );
    res.json({ message: 'Updated' });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// DELETE product
router.delete('/:id', async (req, res) => {
  try {
    await pool.query('DELETE FROM products WHERE id = ?', [req.params.id]);
    res.json({ message: 'Deleted' });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

module.exports = router;
