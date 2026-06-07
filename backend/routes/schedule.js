const express = require('express');
const router = express.Router();
const db = require('../database');
const auth = require('../middleware/auth');

db.run_p(`CREATE TABLE IF NOT EXISTS schedules (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  employee_id INTEGER NOT NULL,
  date DATE NOT NULL,
  shift TEXT DEFAULT 'day',
  start_time TEXT DEFAULT '09:00',
  end_time TEXT DEFAULT '18:00',
  is_day_off INTEGER DEFAULT 0,
  note TEXT,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (employee_id) REFERENCES employees(id) ON DELETE CASCADE
)`).catch(() => {});

// Oylik jadval
router.get('/', auth, async (req, res) => {
  try {
    const { employee_id, month, year } = req.query;
    let q = `SELECT s.*, e.first_name, e.last_name FROM schedules s JOIN employees e ON s.employee_id=e.id WHERE 1=1`;
    const p = [];
    if (employee_id) { q += ' AND s.employee_id=?'; p.push(employee_id); }
    if (month && year) {
      q += ` AND strftime('%m',s.date)=? AND strftime('%Y',s.date)=?`;
      p.push(String(month).padStart(2,'0'), String(year));
    }
    q += ' ORDER BY s.date';
    res.json(await db.all_p(q, p));
  } catch (err) { res.status(500).json({ error: err.message }); }
});

// Jadval qo'shish/yangilash
router.post('/', auth, async (req, res) => {
  try {
    const { employee_id, date, shift, start_time, end_time, is_day_off, note } = req.body;
    const existing = await db.get_p('SELECT id FROM schedules WHERE employee_id=? AND date=?', [employee_id, date]);
    if (existing) {
      await db.run_p('UPDATE schedules SET shift=?,start_time=?,end_time=?,is_day_off=?,note=? WHERE id=?',
        [shift, start_time, end_time, is_day_off ? 1 : 0, note, existing.id]);
    } else {
      await db.run_p('INSERT INTO schedules (employee_id,date,shift,start_time,end_time,is_day_off,note) VALUES (?,?,?,?,?,?,?)',
        [employee_id, date, shift, start_time, end_time, is_day_off ? 1 : 0, note]);
    }
    res.json({ message: 'Saqlandi' });
  } catch (err) { res.status(500).json({ error: err.message }); }
});

// Ommaviy jadval (barcha xodimlar)
router.post('/bulk', auth, async (req, res) => {
  try {
    const { employees, month, year, shift, start_time, end_time } = req.body;
    const daysInMonth = new Date(year, month, 0).getDate();
    let count = 0;
    for (const empId of employees) {
      for (let d = 1; d <= daysInMonth; d++) {
        const date = `${year}-${String(month).padStart(2,'0')}-${String(d).padStart(2,'0')}`;
        const dow = new Date(date).getDay();
        const isDayOff = dow === 0 || dow === 6;
        const existing = await db.get_p('SELECT id FROM schedules WHERE employee_id=? AND date=?', [empId, date]);
        if (!existing) {
          await db.run_p('INSERT INTO schedules (employee_id,date,shift,start_time,end_time,is_day_off) VALUES (?,?,?,?,?,?)',
            [empId, date, isDayOff ? 'off' : (shift || 'day'), isDayOff ? '' : (start_time || '09:00'), isDayOff ? '' : (end_time || '18:00'), isDayOff ? 1 : 0]);
          count++;
        }
      }
    }
    res.json({ message: `${count} ta yozuv qo'shildi` });
  } catch (err) { res.status(500).json({ error: err.message }); }
});

module.exports = router;
