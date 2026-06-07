const express = require('express');
const router = express.Router();
const db = require('../database');
const auth = require('../middleware/auth');

db.run_p(`CREATE TABLE IF NOT EXISTS vacations (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  employee_id INTEGER NOT NULL,
  start_date DATE NOT NULL,
  end_date DATE NOT NULL,
  type TEXT DEFAULT 'annual',
  days INTEGER DEFAULT 0,
  status TEXT DEFAULT 'approved',
  note TEXT,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (employee_id) REFERENCES employees(id) ON DELETE CASCADE
)`).catch(() => {});

// Barcha ta'tillar
router.get('/', auth, async (req, res) => {
  try {
    const { employee_id, year } = req.query;
    let q = `SELECT v.*, e.first_name, e.last_name FROM vacations v JOIN employees e ON v.employee_id=e.id WHERE 1=1`;
    const p = [];
    if (employee_id) { q += ' AND v.employee_id=?'; p.push(employee_id); }
    if (year) { q += ' AND strftime(\'%Y\', v.start_date)=?'; p.push(String(year)); }
    q += ' ORDER BY v.start_date DESC';
    res.json(await db.all_p(q, p));
  } catch (err) { res.status(500).json({ error: err.message }); }
});

// Xodim ta'til hisobi
router.get('/balance/:employee_id', auth, async (req, res) => {
  try {
    const year = new Date().getFullYear();
    const used = await db.get_p(
      `SELECT SUM(days) as total FROM vacations WHERE employee_id=? AND strftime('%Y',start_date)=? AND status='approved'`,
      [req.params.employee_id, String(year)]);
    res.json({ year, used_days: used?.total || 0, allowed_days: 24, remaining: 24 - (used?.total || 0) });
  } catch (err) { res.status(500).json({ error: err.message }); }
});

// Ta'til qo'shish
router.post('/', auth, async (req, res) => {
  try {
    const { employee_id, start_date, end_date, type, note } = req.body;
    const start = new Date(start_date);
    const end = new Date(end_date);
    const days = Math.ceil((end - start) / (1000 * 60 * 60 * 24)) + 1;
    await db.run_p('INSERT INTO vacations (employee_id, start_date, end_date, type, days, note) VALUES (?,?,?,?,?,?)',
      [employee_id, start_date, end_date, type || 'annual', days, note]);
    res.json({ message: 'Ta\'til qo\'shildi', days });
  } catch (err) { res.status(500).json({ error: err.message }); }
});

router.delete('/:id', auth, async (req, res) => {
  try {
    await db.run_p('DELETE FROM vacations WHERE id=?', [req.params.id]);
    res.json({ message: 'O\'chirildi' });
  } catch (err) { res.status(500).json({ error: err.message }); }
});

module.exports = router;
