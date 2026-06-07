const express = require('express');
const router = express.Router();
const db = require('../database');
const auth = require('../middleware/auth');

db.run_p(`CREATE TABLE IF NOT EXISTS evaluations (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  employee_id INTEGER NOT NULL,
  month INTEGER NOT NULL,
  year INTEGER NOT NULL,
  rating INTEGER NOT NULL CHECK(rating BETWEEN 1 AND 5),
  category TEXT DEFAULT 'general',
  comment TEXT,
  evaluated_by TEXT,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (employee_id) REFERENCES employees(id) ON DELETE CASCADE
)`).catch(() => {});

db.run_p(`CREATE TABLE IF NOT EXISTS bonuses (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  employee_id INTEGER NOT NULL,
  amount REAL NOT NULL,
  reason TEXT,
  month INTEGER,
  year INTEGER,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (employee_id) REFERENCES employees(id) ON DELETE CASCADE
)`).catch(() => {});

db.run_p(`CREATE TABLE IF NOT EXISTS penalties (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  employee_id INTEGER NOT NULL,
  amount REAL NOT NULL,
  reason TEXT,
  month INTEGER,
  year INTEGER,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (employee_id) REFERENCES employees(id) ON DELETE CASCADE
)`).catch(() => {});

// Baholashlar
router.get('/', auth, async (req, res) => {
  try {
    const { employee_id, month, year } = req.query;
    let q = `SELECT ev.*, e.first_name, e.last_name, e.position FROM evaluations ev JOIN employees e ON ev.employee_id=e.id WHERE 1=1`;
    const p = [];
    if (employee_id) { q += ' AND ev.employee_id=?'; p.push(employee_id); }
    if (month) { q += ' AND ev.month=?'; p.push(month); }
    if (year) { q += ' AND ev.year=?'; p.push(year); }
    q += ' ORDER BY ev.created_at DESC';
    res.json(await db.all_p(q, p));
  } catch (err) { res.status(500).json({ error: err.message }); }
});

router.post('/', auth, async (req, res) => {
  try {
    const { employee_id, month, year, rating, category, comment } = req.body;
    const user = req.user;
    const result = await db.run_p(
      'INSERT INTO evaluations (employee_id, month, year, rating, category, comment, evaluated_by) VALUES (?,?,?,?,?,?,?)',
      [employee_id, month, year, rating, category || 'general', comment, user.username]
    );
    // Xodimga bildirishnoma
    await db.run_p('INSERT INTO notifications (employee_id, type, title, message) VALUES (?,?,?,?)',
      [employee_id, 'evaluation', 'Baholash natijasi', `${month}-oy uchun ${rating}⭐ baho oldingiz${comment ? ': ' + comment : ''}`]);
    res.json({ id: result.lastID, message: 'Qo\'shildi' });
  } catch (err) { res.status(500).json({ error: err.message }); }
});

router.delete('/:id', auth, async (req, res) => {
  try {
    await db.run_p('DELETE FROM evaluations WHERE id=?', [req.params.id]);
    res.json({ message: 'O\'chirildi' });
  } catch (err) { res.status(500).json({ error: err.message }); }
});

// Xodim o'rtacha bahosi
router.get('/avg/:employee_id', auth, async (req, res) => {
  try {
    const { year } = req.query;
    const stats = await db.get_p(`
      SELECT AVG(rating) as avg_rating, COUNT(*) as total,
        SUM(CASE WHEN rating=5 THEN 1 ELSE 0 END) as five_star
      FROM evaluations WHERE employee_id=? AND year=?`,
      [req.params.employee_id, year || new Date().getFullYear()]);
    res.json(stats);
  } catch (err) { res.status(500).json({ error: err.message }); }
});

// Top xodimlar (reyting)
router.get('/top', auth, async (req, res) => {
  try {
    const { month, year } = req.query;
    const now = new Date();
    const m = month || now.getMonth() + 1;
    const y = year || now.getFullYear();
    const rows = await db.all_p(`
      SELECT e.id, e.first_name, e.last_name, e.position, e.department,
        AVG(ev.rating) as avg_rating, COUNT(ev.id) as eval_count
      FROM employees e
      LEFT JOIN evaluations ev ON e.id=ev.employee_id AND ev.month=? AND ev.year=?
      WHERE e.status='active'
      GROUP BY e.id
      ORDER BY avg_rating DESC NULLS LAST
      LIMIT 10`, [m, y]);
    res.json(rows);
  } catch (err) { res.status(500).json({ error: err.message }); }
});

// Bonuslar
router.get('/bonuses', auth, async (req, res) => {
  try {
    const { employee_id, month, year } = req.query;
    let q = `SELECT b.*, e.first_name, e.last_name FROM bonuses b JOIN employees e ON b.employee_id=e.id WHERE 1=1`;
    const p = [];
    if (employee_id) { q += ' AND b.employee_id=?'; p.push(employee_id); }
    if (month) { q += ' AND b.month=?'; p.push(month); }
    if (year) { q += ' AND b.year=?'; p.push(year); }
    q += ' ORDER BY b.created_at DESC';
    res.json(await db.all_p(q, p));
  } catch (err) { res.status(500).json({ error: err.message }); }
});

router.post('/bonuses', auth, async (req, res) => {
  try {
    const { employee_id, amount, reason, month, year } = req.body;
    const now = new Date();
    await db.run_p('INSERT INTO bonuses (employee_id, amount, reason, month, year) VALUES (?,?,?,?,?)',
      [employee_id, amount, reason, month || now.getMonth()+1, year || now.getFullYear()]);
    await db.run_p('INSERT INTO notifications (employee_id, type, title, message) VALUES (?,?,?,?)',
      [employee_id, 'bonus', '🎉 Bonus berildi', `${amount?.toLocaleString()} so'm bonus: ${reason || ''}`]);
    res.json({ message: 'Bonus qo\'shildi' });
  } catch (err) { res.status(500).json({ error: err.message }); }
});

// Jarimalar
router.get('/penalties', auth, async (req, res) => {
  try {
    const { employee_id, month, year } = req.query;
    let q = `SELECT p.*, e.first_name, e.last_name FROM penalties p JOIN employees e ON p.employee_id=e.id WHERE 1=1`;
    const params = [];
    if (employee_id) { q += ' AND p.employee_id=?'; params.push(employee_id); }
    if (month) { q += ' AND p.month=?'; params.push(month); }
    if (year) { q += ' AND p.year=?'; params.push(year); }
    q += ' ORDER BY p.created_at DESC';
    res.json(await db.all_p(q, params));
  } catch (err) { res.status(500).json({ error: err.message }); }
});

router.post('/penalties', auth, async (req, res) => {
  try {
    const { employee_id, amount, reason, month, year } = req.body;
    const now = new Date();
    await db.run_p('INSERT INTO penalties (employee_id, amount, reason, month, year) VALUES (?,?,?,?,?)',
      [employee_id, amount, reason, month || now.getMonth()+1, year || now.getFullYear()]);
    await db.run_p('INSERT INTO notifications (employee_id, type, title, message) VALUES (?,?,?,?)',
      [employee_id, 'penalty', '⚠️ Jarima', `${amount?.toLocaleString()} so'm jarima: ${reason || ''}`]);
    res.json({ message: 'Jarima qo\'shildi' });
  } catch (err) { res.status(500).json({ error: err.message }); }
});

module.exports = router;
