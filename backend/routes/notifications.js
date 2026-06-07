const express = require('express');
const router = express.Router();
const db = require('../database');
const auth = require('../middleware/auth');

// Bildirishnomalar jadvalini yaratish
db.run_p(`CREATE TABLE IF NOT EXISTS notifications (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  employee_id INTEGER,
  type TEXT,
  title TEXT,
  message TEXT,
  is_read INTEGER DEFAULT 0,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP
)`).catch(() => {});

// Bildirishnomalar ro'yxati
router.get('/', auth, async (req, res) => {
  try {
    const empId = req.user.employee_id;
    const isAdmin = req.user.role === 'admin';
    let rows;
    if (isAdmin) {
      // Admin: employee_id NULL bo'lgan (admin uchun) + o'z employee_id si bo'lganlar
      rows = await db.all_p(
        `SELECT * FROM notifications 
         WHERE employee_id IS NULL OR employee_id = ?
         ORDER BY created_at DESC LIMIT 50`,
        [empId || 0]
      );
    } else {
      rows = await db.all_p(
        'SELECT * FROM notifications WHERE employee_id=? ORDER BY created_at DESC LIMIT 20',
        [empId]
      );
    }
    res.json(rows);
  } catch (err) { res.status(500).json({ error: err.message }); }
});

// O'qildi deb belgilash
router.patch('/:id/read', auth, async (req, res) => {
  try {
    await db.run_p('UPDATE notifications SET is_read=1 WHERE id=?', [req.params.id]);
    res.json({ message: 'O\'qildi' });
  } catch (err) { res.status(500).json({ error: err.message }); }
});

// So'rov bildirishnomalarini o'qildi (admin so'rovlar sahifasini ochganda)
router.patch('/read-requests', auth, async (req, res) => {
  try {
    await db.run_p(
      'UPDATE notifications SET is_read=1 WHERE (employee_id IS NULL OR employee_id=?) AND type=? AND is_read=0',
      [req.user.employee_id || 0, 'request']
    );
    res.json({ message: 'O\'qildi' });
  } catch (err) { res.status(500).json({ error: err.message }); }
});

  // Barchasini o'qildi
  router.patch('/read-all', auth, async (req, res) => {
    try {
      const isAdmin = req.user.role === 'admin';
      if (isAdmin) {
        await db.run_p('UPDATE notifications SET is_read=1 WHERE employee_id IS NULL OR employee_id=?', [req.user.employee_id || 0]);
      } else {
        await db.run_p('UPDATE notifications SET is_read=1 WHERE employee_id=?', [req.user.employee_id]);
      }
      res.json({ message: 'Barchasi o\'qildi' });
    } catch (err) { res.status(500).json({ error: err.message }); }
  });

// Bildirishnoma qo'shish (ichki foydalanish uchun)
router.addNotification = async (employee_id, type, title, message) => {
  try {
    await db.run_p('INSERT INTO notifications (employee_id, type, title, message) VALUES (?,?,?,?)',
      [employee_id, type, title, message]);
  } catch (err) { console.error('Notification error:', err.message); }
};

module.exports = router;
