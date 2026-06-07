const express = require('express');
const router = express.Router();
const db = require('../database');
const auth = require('../middleware/auth');

router.get('/', auth, async (req, res) => {
  try {
    const { month, year } = req.query;
    let query = `
      SELECT s.*, e.first_name, e.last_name, e.position, e.department, e.base_salary, e.salary_type, e.card_number as emp_card
      FROM salary s JOIN employees e ON s.employee_id = e.id WHERE 1=1`;
    const params = [];
    if (month) { query += ' AND s.month = ?'; params.push(month); }
    if (year) { query += ' AND s.year = ?'; params.push(year); }
    query += ' ORDER BY e.last_name';
    res.json(await db.all_p(query, params));
  } catch (err) { res.status(500).json({ error: err.message }); }
});

router.get('/employee/:id', auth, async (req, res) => {
  try {
    res.json(await db.all_p('SELECT * FROM salary WHERE employee_id = ? ORDER BY year DESC, month DESC', [req.params.id]));
  } catch (err) { res.status(500).json({ error: err.message }); }
});

// Maosh tarixi (yil bo'yicha, barcha ishchilar)
router.get('/history', auth, async (req, res) => {
  try {
    const { year, employee_id } = req.query;
    let q = `SELECT s.*, e.first_name, e.last_name, e.position, e.department
             FROM salary s JOIN employees e ON s.employee_id=e.id WHERE 1=1`;
    const p = [];
    if (year) { q += ' AND s.year=?'; p.push(year); }
    if (employee_id) { q += ' AND s.employee_id=?'; p.push(employee_id); }
    q += ' ORDER BY e.last_name, s.month';
    res.json(await db.all_p(q, p));
  } catch (err) { res.status(500).json({ error: err.message }); }
});

// Xodim statistikasi (maosh hisoblash uchun)
router.get('/preview/:employee_id', auth, async (req, res) => {
  try {
    const { month, year } = req.query;
    const pad = String(month).padStart(2, '0');
    const emp = await db.get_p('SELECT * FROM employees WHERE id = ?', [req.params.employee_id]);
    if (!emp) return res.status(404).json({ error: 'Topilmadi' });

    const stats = await db.get_p(`
      SELECT
        SUM(CASE WHEN status='present' THEN 1 ELSE 0 END) as present_days,
        SUM(CASE WHEN status='half' THEN 0.5 ELSE 0 END) as half_days,
        SUM(CASE WHEN status='absent' THEN 1 ELSE 0 END) as absent_days,
        SUM(work_hours) as total_hours,
        SUM(late_minutes) as total_late
      FROM attendance
      WHERE employee_id=? AND strftime('%m',date)=? AND strftime('%Y',date)=?`,
      [req.params.employee_id, pad, String(year)]);

    const worked_days = (stats.present_days || 0) + (stats.half_days || 0);
    const worked_hours = stats.total_hours || 0;
    let base_amount = emp.salary_type === 'monthly'
      ? (emp.base_salary / 26) * worked_days
      : emp.base_salary * worked_hours;

    res.json({
      employee: emp,
      stats: { ...stats, worked_days, worked_hours },
      base_amount: Math.round(base_amount),
      card_number: emp.card_number
    });
  } catch (err) { res.status(500).json({ error: err.message }); }
});

router.post('/calculate', auth, async (req, res) => {
  try {
    const { month, year } = req.body;
    const pad = String(month).padStart(2, '0');
    const employees = await db.all_p('SELECT * FROM employees WHERE status = ?', ['active']);
    let count = 0;
    for (const emp of employees) {
      const stats = await db.get_p(`
        SELECT SUM(CASE WHEN status='present' THEN 1 ELSE 0 END) as p,
               SUM(CASE WHEN status='half' THEN 0.5 ELSE 0 END) as h,
               SUM(work_hours) as wh
        FROM attendance WHERE employee_id=? AND strftime('%m',date)=? AND strftime('%Y',date)=?`,
        [emp.id, pad, String(year)]);
      const worked_days = (stats.p || 0) + (stats.h || 0);
      const worked_hours = stats.wh || 0;
      const base = emp.salary_type === 'monthly' ? (emp.base_salary / 26) * worked_days : emp.base_salary * worked_hours;
      const existing = await db.get_p('SELECT id FROM salary WHERE employee_id=? AND month=? AND year=?', [emp.id, month, year]);
      if (!existing) {
        await db.run_p(`INSERT INTO salary (employee_id,month,year,worked_days,worked_hours,base_amount,total_amount,card_number) VALUES (?,?,?,?,?,?,?,?)`,
          [emp.id, month, year, worked_days, worked_hours, base, base, emp.card_number]);
        count++;
      }
    }
    res.json({ message: 'Hisoblandi', count });
  } catch (err) { res.status(500).json({ error: err.message }); }
});

router.put('/:id', auth, async (req, res) => {
  try {
    const { bonus, deduction, note } = req.body;
    const record = await db.get_p('SELECT * FROM salary WHERE id = ?', [req.params.id]);
    if (!record) return res.status(404).json({ error: 'Topilmadi' });
    const total = record.base_amount + (bonus || 0) - (deduction || 0);
    await db.run_p('UPDATE salary SET bonus=?,deduction=?,total_amount=?,note=? WHERE id=?',
      [bonus || 0, deduction || 0, total, note, req.params.id]);
    res.json({ message: 'Yangilandi', total });
  } catch (err) { res.status(500).json({ error: err.message }); }
});

// To'lov — kartaga o'tkazish yoki naqd
router.patch('/:id/pay', auth, async (req, res) => {
  try {
    const { card_number, sender_card, payment_method, signature } = req.body;
    // payment_method: 'transfer' | 'cash'
    const record = await db.get_p('SELECT s.*, e.first_name, e.last_name FROM salary s JOIN employees e ON s.employee_id=e.id WHERE s.id=?', [req.params.id]);
    if (!record) return res.status(404).json({ error: 'Topilmadi' });
    if (record.is_paid) return res.status(400).json({ error: 'Allaqachon to\'langan' });

    const method = payment_method || 'transfer';

    await db.run_p(
      'UPDATE salary SET is_paid=1, paid_date=DATE("now"), card_number=?, sender_card=?, payment_method=?, signature=? WHERE id=?',
      [card_number || record.card_number, sender_card || null, method, signature || null, req.params.id]
    );

    // Bildirishnoma
    const MONTHS = ['','Yanvar','Fevral','Mart','Aprel','May','Iyun','Iyul','Avgust','Sentabr','Oktabr','Noyabr','Dekabr'];
    const fmt = n => new Intl.NumberFormat('uz-UZ').format(Math.round(n || 0));
    const methodText = method === 'cash' ? 'naqd pul' : 'karta orqali';
    await db.run_p('INSERT INTO notifications (employee_id, type, title, message) VALUES (?,?,?,?)', [
      record.employee_id, 'salary',
      'Maosh to\'landi',
      `${MONTHS[record.month]} ${record.year} uchun ${fmt(record.total_amount)} so'm ${methodText} berildi.`
    ]);

    res.json({
      message: 'To\'lov amalga oshirildi',
      employee: `${record.last_name} ${record.first_name}`,
      amount: record.total_amount,
      method,
      card: card_number || record.card_number,
      date: new Date().toLocaleDateString('uz-UZ')
    });
  } catch (err) { res.status(500).json({ error: err.message }); }
});

router.post('/pay-all', auth, async (req, res) => {
  try {
    const { month, year } = req.body;
    await db.run_p('UPDATE salary SET is_paid=1, paid_date=DATE("now") WHERE month=? AND year=? AND is_paid=0', [month, year]);
    res.json({ message: 'Barchaga to\'landi' });
  } catch (err) { res.status(500).json({ error: err.message }); }
});

module.exports = router;
