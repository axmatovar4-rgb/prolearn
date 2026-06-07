const express = require('express');
const router = express.Router();
const db = require('../database');
const auth = require('../middleware/auth');

// Jadvallar
db.run_p(`CREATE TABLE IF NOT EXISTS messages (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  from_id INTEGER NOT NULL,
  from_name TEXT,
  to_id INTEGER,
  message TEXT NOT NULL,
  is_read INTEGER DEFAULT 0,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP
)`).catch(() => {});

db.run_p(`CREATE TABLE IF NOT EXISTS announcements (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  title TEXT NOT NULL,
  body TEXT NOT NULL,
  priority TEXT DEFAULT 'normal',
  author TEXT,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP
)`).catch(() => {});

// ===== XABARLAR =====

// Xabarlar ro'yxati (men bilan bog'liq)
router.get('/', auth, async (req, res) => {
  try {
    const empId = req.user.employee_id;
    const isAdmin = req.user.role === 'admin';
    let rows;
    if (isAdmin) {
      // Admin: barcha xabarlar
      rows = await db.all_p(`
        SELECT m.*, e.first_name, e.last_name
        FROM messages m
        LEFT JOIN employees e ON m.from_id = e.id
        ORDER BY m.created_at DESC LIMIT 100`);
    } else {
      rows = await db.all_p(`
        SELECT * FROM messages
        WHERE to_id = ? OR from_id = ?
        ORDER BY created_at DESC LIMIT 50`,
        [empId, empId]);
    }
    res.json(rows);
  } catch (err) { res.status(500).json({ error: err.message }); }
});

// O'qilmagan xabarlar soni
router.get('/unread', auth, async (req, res) => {
  try {
    const empId = req.user.employee_id;
    const r = await db.get_p(
      'SELECT COUNT(*) as count FROM messages WHERE to_id = ? AND is_read = 0',
      [empId]);
    res.json({ count: r?.count || 0 });
  } catch (err) { res.status(500).json({ error: err.message }); }
});

// Xabar yuborish
router.post('/', auth, async (req, res) => {
  try {
    const { to_id, message } = req.body;
    const empId = req.user.employee_id;
    const isAdmin = req.user.role === 'admin';
    if (!message?.trim()) return res.status(400).json({ error: 'Xabar bo\'sh' });

    const fromName = isAdmin ? 'Admin' : req.user.username;
    await db.run_p(
      'INSERT INTO messages (from_id, from_name, to_id, message) VALUES (?,?,?,?)',
      [empId || 0, fromName, to_id || null, message.trim()]
    );

    // Bildirishnoma
    if (to_id) {
      await db.run_p(
        'INSERT INTO notifications (employee_id, type, title, message) VALUES (?,?,?,?)',
        [to_id, 'message', `💬 ${fromName} dan xabar`, message.trim().slice(0, 80)]
      );
    }
    res.json({ message: 'Yuborildi' });
  } catch (err) { res.status(500).json({ error: err.message }); }
});

// O'qildi
router.patch('/:id/read', auth, async (req, res) => {
  try {
    await db.run_p('UPDATE messages SET is_read=1 WHERE id=?', [req.params.id]);
    res.json({ message: 'O\'qildi' });
  } catch (err) { res.status(500).json({ error: err.message }); }
});

// O'chirish
router.delete('/:id', auth, async (req, res) => {
  try {
    await db.run_p('DELETE FROM messages WHERE id=?', [req.params.id]);
    res.json({ message: 'O\'chirildi' });
  } catch (err) { res.status(500).json({ error: err.message }); }
});

// ===== E'LONLAR =====

router.get('/announcements', auth, async (req, res) => {
  try {
    res.json(await db.all_p('SELECT * FROM announcements ORDER BY created_at DESC LIMIT 20'));
  } catch (err) { res.status(500).json({ error: err.message }); }
});

router.post('/announcements', auth, async (req, res) => {
  try {
    if (req.user.role !== 'admin') return res.status(403).json({ error: 'Faqat admin' });
    const { title, body, priority } = req.body;
    if (!title || !body) return res.status(400).json({ error: 'Sarlavha va matn kerak' });

    await db.run_p(
      'INSERT INTO announcements (title, body, priority, author) VALUES (?,?,?,?)',
      [title, body, priority || 'normal', req.user.username]
    );

    // Barcha xodimlarga bildirishnoma
    const employees = await db.all_p('SELECT id FROM employees WHERE status="active"');
    for (const emp of employees) {
      await db.run_p(
        'INSERT INTO notifications (employee_id, type, title, message) VALUES (?,?,?,?)',
        [emp.id, 'announcement', `📢 ${title}`, body.slice(0, 100)]
      );
    }
    // Adminga ham (null)
    await db.run_p(
      'INSERT INTO notifications (employee_id, type, title, message) VALUES (?,?,?,?)',
      [null, 'announcement', `📢 ${title}`, body.slice(0, 100)]
    );

    res.json({ message: 'E\'lon joylashtirildi' });
  } catch (err) { res.status(500).json({ error: err.message }); }
});

router.delete('/announcements/:id', auth, async (req, res) => {
  try {
    if (req.user.role !== 'admin') return res.status(403).json({ error: 'Faqat admin' });
    await db.run_p('DELETE FROM announcements WHERE id=?', [req.params.id]);
    res.json({ message: 'O\'chirildi' });
  } catch (err) { res.status(500).json({ error: err.message }); }
});

module.exports = router;
