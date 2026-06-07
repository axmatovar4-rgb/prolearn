const express = require('express');
const router = express.Router();
const db = require('../database');
const auth = require('../middleware/auth');

router.get('/', auth, async (req, res) => {
  try {
    const { month, year, employee_id } = req.query;
    let query = `SELECT a.*, e.first_name, e.last_name, e.position, e.department FROM attendance a JOIN employees e ON a.employee_id = e.id WHERE 1=1`;
    const params = [];
    if (month && year) { query += ` AND strftime('%m', a.date) = ? AND strftime('%Y', a.date) = ?`; params.push(String(month).padStart(2,'0'), String(year)); }
    if (employee_id) { query += ' AND a.employee_id = ?'; params.push(employee_id); }
    query += ' ORDER BY a.date DESC';
    res.json(await db.all_p(query, params));
  } catch (err) { res.status(500).json({ error: err.message }); }
});

router.get('/employee/:id', auth, async (req, res) => {
  try {
    const { month, year } = req.query;
    let query = 'SELECT * FROM attendance WHERE employee_id = ?';
    const params = [req.params.id];
    if (month && year) { query += ` AND strftime('%m', date) = ? AND strftime('%Y', date) = ?`; params.push(String(month).padStart(2,'0'), String(year)); }
    query += ' ORDER BY date DESC';
    res.json(await db.all_p(query, params));
  } catch (err) { res.status(500).json({ error: err.message }); }
});

router.post('/', auth, async (req, res) => {
  try {
    const { employee_id, date, status, check_in, check_out, work_hours, late_minutes, note } = req.body;
    const existing = await db.get_p('SELECT id FROM attendance WHERE employee_id = ? AND date = ?', [employee_id, date]);

    // status null/undefined bo'lsa — yozuvni o'chirish
    if (status === null || status === undefined || status === '') {
      if (existing) {
        await db.run_p('DELETE FROM attendance WHERE employee_id = ? AND date = ?', [employee_id, date]);
      }
      return res.json({ message: 'O\'chirildi' });
    }

    // Kechikish avtomatik jarima hisoblash
    const LATE_THRESHOLD = 15; // 15 daqiqadan keyin kechikish
    const FINE_PER_MINUTE = 1000; // 1 daqiqa uchun 1000 so'm jarima
    const lateMin = late_minutes || 0;

    if (lateMin > LATE_THRESHOLD) {
      // Joriy oy maoshiga jarima qo'shish
      const d = new Date(date);
      const month = d.getMonth() + 1;
      const year = d.getFullYear();
      const fineAmount = (lateMin - LATE_THRESHOLD) * FINE_PER_MINUTE;

      const salaryRecord = await db.get_p(
        'SELECT * FROM salary WHERE employee_id=? AND month=? AND year=?',
        [employee_id, month, year]
      );

      if (salaryRecord) {
        const newDeduction = (salaryRecord.deduction || 0) + fineAmount;
        const newTotal = salaryRecord.base_amount + (salaryRecord.bonus || 0) - newDeduction;
        await db.run_p(
          'UPDATE salary SET deduction=?, total_amount=? WHERE id=?',
          [newDeduction, newTotal, salaryRecord.id]
        );
        // Xodimga bildirishnoma
        await db.run_p(
          'INSERT INTO notifications (employee_id, type, title, message) VALUES (?,?,?,?)',
          [employee_id, 'late_fine', '⚠️ Kechikish jarima',
           `${date} — ${lateMin} daqiqa kechikish uchun ${fineAmount.toLocaleString()} so'm jarima qo'shildi`]
        );
      }
    }

    if (existing) {
      await db.run_p(`UPDATE attendance SET status=?,check_in=?,check_out=?,work_hours=?,late_minutes=?,note=? WHERE employee_id=? AND date=?`,
        [status, check_in, check_out, work_hours, late_minutes, note, employee_id, date]);
      return res.json({ message: 'Yangilandi' });
    }
    await db.run_p(`INSERT INTO attendance (employee_id, date, status, check_in, check_out, work_hours, late_minutes, note) VALUES (?,?,?,?,?,?,?,?)`,
      [employee_id, date, status, check_in, check_out, work_hours, late_minutes, note]);
    res.json({ message: 'Qo\'shildi' });
  } catch (err) { res.status(500).json({ error: err.message }); }
});

router.get('/stats/:employee_id', auth, async (req, res) => {
  try {
    const { month, year } = req.query;
    const pad = String(month).padStart(2,'0');
    const stats = await db.get_p(`
      SELECT
        COUNT(*) as total_days,
        SUM(CASE WHEN status='present' THEN 1 ELSE 0 END) as present_days,
        SUM(CASE WHEN status='absent' THEN 1 ELSE 0 END) as absent_days,
        SUM(CASE WHEN status='half' THEN 1 ELSE 0 END) as half_days,
        SUM(work_hours) as total_hours,
        SUM(late_minutes) as total_late
      FROM attendance WHERE employee_id=? AND strftime('%m',date)=? AND strftime('%Y',date)=?`,
      [req.params.employee_id, pad, String(year)]);
    res.json(stats);
  } catch (err) { res.status(500).json({ error: err.message }); }
});

router.delete('/:id', auth, async (req, res) => {
  try {
    await db.run_p('DELETE FROM attendance WHERE id = ?', [req.params.id]);
    res.json({ message: 'O\'chirildi' });
  } catch (err) { res.status(500).json({ error: err.message }); }
});

module.exports = router;
