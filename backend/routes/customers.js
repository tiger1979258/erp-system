const express = require('express');
const router = express.Router();
const pool = require('../config/database');

router.get('/', async (req, res) => {
  try { const [rows] = await pool.query('SELECT * FROM customers ORDER BY id'); res.json(rows); }
  catch (err) { res.status(500).json({ error: err.message }); }
});

router.post('/', async (req, res) => {
  try {
    const { customer_code, customer_name, contact_person, phone, address, remark } = req.body;
    const [result] = await pool.query('INSERT INTO customers (customer_code, customer_name, contact_person, phone, address, remark) VALUES (?, ?, ?, ?, ?, ?)',
      [customer_code, customer_name, contact_person, phone, address, remark]);
    res.json({ id: result.insertId });
  } catch (err) { res.status(500).json({ error: err.message }); }
});

router.put('/:id', async (req, res) => {
  try {
    const { customer_name, contact_person, phone, address, remark } = req.body;
    await pool.query('UPDATE customers SET customer_name=?, contact_person=?, phone=?, address=?, remark=? WHERE id=?',
      [customer_name, contact_person, phone, address, remark, req.params.id]);
    res.json({ message: 'Updated' });
  } catch (err) { res.status(500).json({ error: err.message }); }
});

router.delete('/:id', async (req, res) => {
  try { await pool.query('DELETE FROM customers WHERE id = ?', [req.params.id]); res.json({ message: 'Deleted' }); }
  catch (err) { res.status(500).json({ error: err.message }); }
});

module.exports = router;
