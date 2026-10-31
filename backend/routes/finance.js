const express = require('express');
const router = express.Router();
const pool = require('../config/database');

// GET all finance records
router.get('/', async (req, res) => {
  try {
    const { start_date, end_date, record_type } = req.query;
    let sql = 'SELECT * FROM finance_records WHERE 1=1';
    const params = [];
    if (start_date) { sql += ' AND record_date >= ?'; params.push(start_date); }
    if (end_date) { sql += ' AND record_date <= ?'; params.push(end_date); }
    if (record_type) { sql += ' AND record_type = ?'; params.push(record_type); }
    sql += ' ORDER BY record_date DESC, id DESC';
    const [rows] = await pool.query(sql, params);
    res.json(rows);
  } catch (err) { res.status(500).json({ error: err.message }); }
});

// GET finance summary
router.get('/summary/stats', async (req, res) => {
  try {
    const { start_date, end_date } = req.query;
    let where = 'WHERE 1=1';
    const params = [];
    if (start_date) { where += ' AND record_date >= ?'; params.push(start_date); }
    if (end_date) { where += ' AND record_date <= ?'; params.push(end_date); }
    const [income] = await pool.query(`SELECT COALESCE(SUM(amount),0) as total FROM finance_records ${where} AND record_type = 'income'`, params);
    const [expense] = await pool.query(`SELECT COALESCE(SUM(amount),0) as total FROM finance_records ${where} AND record_type = 'expense'`, params);
    const [byCategory] = await pool.query(
      `SELECT category, record_type, COALESCE(SUM(amount),0) as total FROM finance_records ${where} GROUP BY category, record_type ORDER BY total DESC`,
      params
    );
    res.json({
      total_income: income[0].total,
      total_expense: expense[0].total,
      net_profit: income[0].total - expense[0].total,
      by_category: byCategory
    });
  } catch (err) { res.status(500).json({ error: err.message }); }
});

// POST create finance record
router.post('/', async (req, res) => {
  try {
    const { record_no, record_type, category, related_type, related_id, amount, account, record_date, remark } = req.body;
    const [result] = await pool.query(
      'INSERT INTO finance_records (record_no, record_type, category, related_type, related_id, amount, account, record_date, remark) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)',
      [record_no, record_type, category, related_type || 'other', related_id || 0, amount, account || '现金', record_date, remark || '']
    );
    res.json({ id: result.insertId });
  } catch (err) { res.status(500).json({ error: err.message }); }
});

// PUT update finance record
router.put('/:id', async (req, res) => {
  try {
    const { record_type, category, related_type, related_id, amount, account, record_date, remark } = req.body;
    await pool.query(
      'UPDATE finance_records SET record_type=?, category=?, related_type=?, related_id=?, amount=?, account=?, record_date=?, remark=? WHERE id=?',
      [record_type, category, related_type, related_id, amount, account, record_date, remark, req.params.id]
    );
    res.json({ message: 'Updated' });
  } catch (err) { res.status(500).json({ error: err.message }); }
});

// DELETE finance record
router.delete('/:id', async (req, res) => {
  try { await pool.query('DELETE FROM finance_records WHERE id = ?', [req.params.id]); res.json({ message: 'Deleted' }); }
  catch (err) { res.status(500).json({ error: err.message }); }
});

module.exports = router;
