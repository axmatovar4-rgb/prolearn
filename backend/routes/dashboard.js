const express = require('express');
const router = express.Router();
const db = require('../database');
const auth = require('../middleware/auth');

router.get('/', auth, async (req, res) => {
  try {
    const today = new Date().toISOString().split('T')[0];
    const now = new Date();
    const month = now.getMonth() + 1;
    const year = now.getFullYear();

    // Oldingi oy
    const prevDate = new Date(now.getFullYear(), now.getMonth() - 1, 1);
    const prevMonth = prevDate.getMonth() + 1;
    const prevYear = prevDate.getFullYear();

    const total = await db.get_p('SELECT COUNT(*) as count FROM employees WHERE status="active"');
    const blocked = await db.get_p('SELECT COUNT(*) as count FROM employees WHERE status="blocked"');
    const present = await db.get_p('SELECT COUNT(*) as count FROM attendance WHERE date=? AND status="present"', [today]);
    const absent = await db.get_p('SELECT COUNT(*) as count FROM attendance WHERE date=? AND status="absent"', [today]);

    const salaryStats = await db.get_p(
      `SELECT SUM(total_amount) as total, SUM(CASE WHEN is_paid=1 THEN total_amount ELSE 0 END) as paid FROM salary WHERE month=? AND year=?`,
      [month, year]);

    const departments = await db.all_p(
      `SELECT department, COUNT(*) as count FROM employees WHERE status='active' AND department IS NOT NULL GROUP BY department`);

    // Ikki oylik statistika (bu oy + o'tgan oy)
    const twoMonthStats = await db.all_p(`
      SELECT s.month, s.year,
        SUM(s.total_amount) as total_salary,
        SUM(CASE WHEN s.is_paid=1 THEN s.total_amount ELSE 0 END) as paid_salary,
        COUNT(DISTINCT s.employee_id) as employee_count,
        AVG(s.worked_days) as avg_days
      FROM salary s
      WHERE (s.month=? AND s.year=?) OR (s.month=? AND s.year=?)
      GROUP BY s.year, s.month
      ORDER BY s.year, s.month`,
      [prevMonth, prevYear, month, year]);

    // Top 5 aktiv ishchi (bu oy)
    const topEmployees = await db.all_p(`
      SELECT e.first_name, e.last_name, e.position,
        SUM(CASE WHEN a.status='present' THEN 1 ELSE 0 END) as present_days,
        SUM(a.work_hours) as total_hours
      FROM employees e
      LEFT JOIN attendance a ON e.id=a.employee_id
        AND strftime('%m',a.date)=? AND strftime('%Y',a.date)=?
      WHERE e.status='active'
      GROUP BY e.id
      ORDER BY present_days DESC
      LIMIT 5`,
      [String(month).padStart(2,'0'), String(year)]);

    res.json({
      total_employees: total.count,
      blocked_employees: blocked.count,
      today_present: present.count,
      today_absent: absent.count,
      monthly_salary_total: salaryStats?.total || 0,
      monthly_salary_paid: salaryStats?.paid || 0,
      departments,
      two_month_stats: twoMonthStats,
      top_employees: topEmployees
    });
  } catch (err) { res.status(500).json({ error: err.message }); }
});

module.exports = router;
