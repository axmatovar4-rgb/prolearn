const express = require('express');
const router = express.Router();
const db = require('../database');
const auth = require('../middleware/auth');
const jwt = require('jsonwebtoken');
const SECRET = process.env.JWT_SECRET || 'ishxona_secret_key';

const exportAuth = (req, res, next) => {
  const token = req.headers.authorization?.split(' ')[1] || req.query.token;
  if (!token) return res.status(401).json({ error: 'Token kerak' });
  try { req.user = jwt.verify(token, SECRET); next(); }
  catch { res.status(401).json({ error: 'Token yaroqsiz' }); }
};

// Yillik xarajat tahlili (bo'limlar bo'yicha)
router.get('/department-cost', auth, async (req, res) => {
  try {
    const { year } = req.query;
    const y = year || new Date().getFullYear();
    const rows = await db.all_p(`
      SELECT e.department,
        COUNT(DISTINCT e.id) as employee_count,
        SUM(s.total_amount) as total_cost,
        AVG(s.total_amount) as avg_salary,
        SUM(CASE WHEN s.is_paid=1 THEN s.total_amount ELSE 0 END) as paid_cost
      FROM employees e
      LEFT JOIN salary s ON e.id=s.employee_id AND s.year=?
      WHERE e.status='active' AND e.department IS NOT NULL
      GROUP BY e.department
      ORDER BY total_cost DESC`, [y]);
    res.json(rows);
  } catch (err) { res.status(500).json({ error: err.message }); }
});

// Oylik xarajat dinamikasi
router.get('/monthly-cost', auth, async (req, res) => {
  try {
    const { year } = req.query;
    const y = year || new Date().getFullYear();
    const rows = await db.all_p(`
      SELECT month, SUM(total_amount) as total, SUM(CASE WHEN is_paid=1 THEN total_amount ELSE 0 END) as paid,
        COUNT(DISTINCT employee_id) as employees
      FROM salary WHERE year=?
      GROUP BY month ORDER BY month`, [y]);
    res.json(rows);
  } catch (err) { res.status(500).json({ error: err.message }); }
});

// Ishdan bo'shatish statistikasi
router.get('/turnover', auth, async (req, res) => {
  try {
    const active = await db.get_p('SELECT COUNT(*) as c FROM employees WHERE status="active"');
    const blocked = await db.get_p('SELECT COUNT(*) as c FROM employees WHERE status="blocked"');
    const total = await db.get_p('SELECT COUNT(*) as c FROM employees');

    // Kechikish statistikasi (oy bo'yicha)
    const lateStats = await db.all_p(`
      SELECT strftime('%Y-%m', date) as ym,
        COUNT(*) as late_count,
        SUM(late_minutes) as total_minutes,
        COUNT(DISTINCT employee_id) as late_employees
      FROM attendance WHERE late_minutes > 0
      GROUP BY ym ORDER BY ym DESC LIMIT 6`);

    res.json({ active: active.c, blocked: blocked.c, total: total.c, late_stats: lateStats });
  } catch (err) { res.status(500).json({ error: err.message }); }
});

// Xodim yillik maosh o'sishi
router.get('/salary-growth/:employee_id', auth, async (req, res) => {
  try {
    const rows = await db.all_p(`
      SELECT year, month, total_amount, worked_days, is_paid
      FROM salary WHERE employee_id=?
      ORDER BY year, month`, [req.params.employee_id]);
    res.json(rows);
  } catch (err) { res.status(500).json({ error: err.message }); }
});

// Umumiy HR hisobot (HTML)
router.get('/hr-report', exportAuth, async (req, res) => {
  try {
    const { year } = req.query;
    const y = year || new Date().getFullYear();

    const deptCost = await db.all_p(`
      SELECT e.department, COUNT(DISTINCT e.id) as emp_count, SUM(s.total_amount) as total
      FROM employees e LEFT JOIN salary s ON e.id=s.employee_id AND s.year=?
      WHERE e.status='active' GROUP BY e.department`, [y]);

    const topEmp = await db.all_p(`
      SELECT e.first_name, e.last_name, e.department,
        AVG(ev.rating) as avg_rating, SUM(s.total_amount) as total_salary
      FROM employees e
      LEFT JOIN evaluations ev ON e.id=ev.employee_id AND ev.year=?
      LEFT JOIN salary s ON e.id=s.employee_id AND s.year=?
      WHERE e.status='active'
      GROUP BY e.id ORDER BY avg_rating DESC NULLS LAST LIMIT 10`, [y, y]);

    const fmt = n => new Intl.NumberFormat('uz-UZ').format(Math.round(n || 0));

    const html = `<!DOCTYPE html>
<html lang="uz">
<head>
<meta charset="UTF-8">
<title>HR Hisobot ${y}</title>
<style>
  body{font-family:Arial;font-size:13px;margin:20px;color:#333}
  h1{color:#6366f1;border-bottom:2px solid #6366f1;pb:8px}
  h2{color:#444;margin-top:24px}
  table{width:100%;border-collapse:collapse;margin:12px 0}
  th,td{border:1px solid #ddd;padding:8px 10px;text-align:left}
  th{background:#f0f0ff;font-weight:bold}
  .star{color:#f59e0b}
  @media print{button{display:none}}
</style>
</head>
<body>
<button onclick="window.print()" style="padding:8px 16px;background:#6366f1;color:white;border:none;border-radius:6px;cursor:pointer;margin-bottom:16px">🖨️ Chop etish</button>
<h1>HR Hisobot — ${y} yil</h1>

<h2>Bo'limlar bo'yicha xarajat</h2>
<table>
  <thead><tr><th>Bo'lim</th><th>Ishchilar</th><th>Jami maosh</th></tr></thead>
  <tbody>${deptCost.map(d => `<tr><td>${d.department||'?'}</td><td>${d.emp_count}</td><td>${fmt(d.total)} so'm</td></tr>`).join('')}</tbody>
</table>

<h2>Top 10 xodim (baholash bo'yicha)</h2>
<table>
  <thead><tr><th>#</th><th>F.I.O</th><th>Bo'lim</th><th>Baho</th><th>Maosh</th></tr></thead>
  <tbody>${topEmp.map((e,i) => `<tr><td>${i+1}</td><td>${e.last_name} ${e.first_name}</td><td>${e.department||'?'}</td><td class="star">${e.avg_rating ? '★'.repeat(Math.round(e.avg_rating)) : '—'}</td><td>${fmt(e.total_salary)} so'm</td></tr>`).join('')}</tbody>
</table>
</body></html>`;

    res.setHeader('Content-Type', 'text/html; charset=utf-8');
    res.send(html);
  } catch (err) { res.status(500).json({ error: err.message }); }
});

module.exports = router;
