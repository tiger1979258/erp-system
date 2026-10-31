const express = require('express');
const router = express.Router();
const pool = require('../config/database');

router.get('/', async (req, res) => {
  try { const [rows] = await pool.query('SELECT * FROM suppliers ORDER BY id'); res.json(rows); }
  catch (err) { res.status(500).json({ error: err.message }); }
});

router.post('/', async (req, res) => {
  try {
    const { supplier_code, supplier_name, contact_person, phone, address, remark } = req.body;
    const [result] = await pool.query('INSERT INTO suppliers (supplier_code, supplier_name, contact_person, phone, address, remark) VALUES (?, ?, ?, ?, ?, ?)',
      [supplier_code, supplier_name, contact_person, phone, address, remark]);
    res.json({ id: result.insertId });
  } catch (err) { res.status(500).json({ error: err.message }); }
});

router.put('/:id', async (req, res) => {
  try {
    const { supplier_name, contact_person, phone, address, remark } = req.body;
    await pool.query('UPDATE suppliers SET supplier_name=?, contact_person=?, phone=?, address=?, remark=? WHERE id=?',
      [supplier_name, contact_person, phone, address, remark, req.params.id]);
    res.json({ message: 'Updated' });
  } catch (err) { res.status(500).json({ error: err.message }); }
});

router.delete('/:id', async (req, res) => {
  try { await pool.query('DELETE FROM suppliers WHERE id = ?', [req.params.id]); res.json({ message: 'Deleted' }); }
  catch (err) { res.status(500).json({ error: err.message }); }
});

module.exports = router;
