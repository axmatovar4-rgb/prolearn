const express = require('express');
const router = express.Router();
const db = require('../database');
const auth = require('../middleware/auth');

// Jadval yaratish
db.run_p(`CREATE TABLE IF NOT EXISTS requests (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  employee_id INTEGER NOT NULL,
  type TEXT DEFAULT 'leave',
  title TEXT NOT NULL,
  description TEXT,
  start_date DATE,
  end_date DATE,
  status TEXT DEFAULT 'pending',
  admin_note TEXT,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (employee_id) REFERENCES employees(id) ON DELETE CASCADE
)`).catch(() => {});

// Barcha so'rovlar (admin)
router.get('/', auth, async (req, res) => {
  try {
    const { status, type } = req.query;
    const isAdmin = req.user.role === 'admin';
    let q = `SELECT r.*, e.first_name, e.last_name, e.position, e.department
             FROM requests r LEFT JOIN employees e ON r.employee_id = e.id WHERE 1=1`;
    const p = [];
    if (!isAdmin) { q += ' AND r.employee_id = ?'; p.push(req.user.employee_id); }
    if (status) { q += ' AND r.status = ?'; p.push(status); }
    if (type) { q += ' AND r.type = ?'; p.push(type); }
    q += ' ORDER BY r.created_at DESC';
    res.json(await db.all_p(q, p));
  } catch (err) { res.status(500).json({ error: err.message }); }
});

// Yangi so'rov yuborish (xodim)
router.post('/', auth, async (req, res) => {
  try {
    const { type, title, description, start_date, end_date } = req.body;
    const empId = req.user.employee_id;
    if (!empId) return res.status(403).json({ error: 'Ruxsat yo\'q' });

    // title avtomatik — tur nomi
    const typeLabels = { leave: 'Ta\'tilga chiqish', sick: 'Kasallik', permission: 'Ruxsat (qisqa)', other: 'Boshqa' };
    const autoTitle = typeLabels[type] || type;

    const result = await db.run_p(
      `INSERT INTO requests (employee_id, type, title, description, start_date, end_date) VALUES (?,?,?,?,?,?)`,
      [empId, type || 'permission', title || autoTitle, description, start_date, end_date]
    );

    // Adminga bildirishnoma — to'g'ri title bilan
    const emp = await db.get_p('SELECT * FROM employees WHERE id = ?', [empId]);
    const notifTitle = autoTitle;
    const notifMsg = `${emp?.last_name || ''} ${emp?.first_name || ''}: ${description || notifTitle}`;
    await db.run_p(
      'INSERT INTO notifications (employee_id, type, title, message) VALUES (?,?,?,?)',
      [null, 'request', `🆕 Yangi so'rov: ${notifTitle}`, notifMsg]
    );

    res.json({ id: result.lastID, message: 'So\'rov yuborildi' });
  } catch (err) { res.status(500).json({ error: err.message }); }
});

// Tasdiqlash / Rad etish (admin)
router.patch('/:id', auth, async (req, res) => {
  try {
    if (req.user.role !== 'admin') return res.status(403).json({ error: 'Faqat admin' });
    const { status, admin_note } = req.body;
    if (!['approved', 'rejected'].includes(status)) return res.status(400).json({ error: 'Noto\'g\'ri holat' });

    const record = await db.get_p('SELECT * FROM requests WHERE id = ?', [req.params.id]);
    if (!record) return res.status(404).json({ error: 'Topilmadi' });

    await db.run_p(
      `UPDATE requests SET status=?, admin_note=?, updated_at=DATETIME('now') WHERE id=?`,
      [status, admin_note || '', req.params.id]
    );

    // Xodimga bildirishnoma
    const statusText = status === 'approved' ? '✅ Tasdiqlandi' : '❌ Rad etildi';
    await db.run_p(
      'INSERT INTO notifications (employee_id, type, title, message) VALUES (?,?,?,?)',
      [record.employee_id, 'request_update', `So'rovingiz ${statusText}`,
       `"${record.title}" so'rovingiz ${statusText.toLowerCase()}${admin_note ? ': ' + admin_note : ''}`]
    );

    res.json({ message: 'Yangilandi' });
  } catch (err) { res.status(500).json({ error: err.message }); }
});

// O'chirish
router.delete('/:id', auth, async (req, res) => {
  try {
    await db.run_p('DELETE FROM requests WHERE id = ?', [req.params.id]);
    res.json({ message: 'O\'chirildi' });
  } catch (err) { res.status(500).json({ error: err.message }); }
});

module.exports = router;
