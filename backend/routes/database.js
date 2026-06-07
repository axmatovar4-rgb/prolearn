const express = require('express');
const router = express.Router();
const db = require('../database');
const auth = require('../middleware/auth');
const path = require('path');
const fs = require('fs');

// Faqat admin
const adminOnly = (req, res, next) => {
  if (req.user.role !== 'admin') return res.status(403).json({ error: 'Faqat admin' });
  next();
};

// Database statistika
router.get('/stats', auth, adminOnly, async (req, res) => {
  try {
    const tables = ['employees', 'attendance', 'salary', 'notifications', 'vacations', 'requests'];
    const stats = {};
    for (const t of tables) {
      const r = await db.get_p(`SELECT COUNT(*) as count FROM ${t}`).catch(() => ({ count: 0 }));
      stats[t] = r.count;
    }
    // DB fayl hajmi
    const dbPath = path.join(__dirname, '../ishxona.db');
    const fileSize = fs.existsSync(dbPath) ? fs.statSync(dbPath).size : 0;
    res.json({ tables: stats, db_size: fileSize, db_size_mb: (fileSize / 1024 / 1024).toFixed(2) });
  } catch (err) { res.status(500).json({ error: err.message }); }
});

// Jadval ma'lumotlari
router.get('/table/:name', auth, adminOnly, async (req, res) => {
  try {
    const allowed = ['employees', 'attendance', 'salary', 'notifications', 'vacations', 'requests', 'users'];
    if (!allowed.includes(req.params.name)) return res.status(400).json({ error: 'Ruxsat yo\'q' });
    const { limit = 50, offset = 0, search = '' } = req.query;
    let rows;
    if (search && req.params.name === 'employees') {
      rows = await db.all_p(
        `SELECT * FROM ${req.params.name} WHERE first_name LIKE ? OR last_name LIKE ? LIMIT ? OFFSET ?`,
        [`%${search}%`, `%${search}%`, Number(limit), Number(offset)]
      );
    } else {
      rows = await db.all_p(`SELECT * FROM ${req.params.name} LIMIT ? OFFSET ?`, [Number(limit), Number(offset)]);
    }
    const total = await db.get_p(`SELECT COUNT(*) as count FROM ${req.params.name}`);
    res.json({ rows, total: total.count });
  } catch (err) { res.status(500).json({ error: err.message }); }
});

// Backup — DB faylini yuklab olish
router.get('/backup', auth, adminOnly, (req, res) => {
  try {
    const dbPath = path.join(__dirname, '../ishxona.db');
    if (!fs.existsSync(dbPath)) return res.status(404).json({ error: 'DB fayl topilmadi' });
    const date = new Date().toISOString().slice(0, 10);
    res.setHeader('Content-Disposition', `attachment; filename="ishxona_backup_${date}.db"`);
    res.setHeader('Content-Type', 'application/octet-stream');
    res.sendFile(dbPath);
  } catch (err) { res.status(500).json({ error: err.message }); }
});

// JSON export — bitta jadval
router.get('/export/:table', auth, adminOnly, async (req, res) => {
  try {
    const allowed = ['employees', 'attendance', 'salary', 'vacations', 'requests'];
    if (!allowed.includes(req.params.table)) return res.status(400).json({ error: 'Ruxsat yo\'q' });
    const rows = await db.all_p(`SELECT * FROM ${req.params.table}`);
    const date = new Date().toISOString().slice(0, 10);
    res.setHeader('Content-Disposition', `attachment; filename="${req.params.table}_${date}.json"`);
    res.setHeader('Content-Type', 'application/json');
    res.send(JSON.stringify(rows, null, 2));
  } catch (err) { res.status(500).json({ error: err.message }); }
});

// Yozuvni o'chirish
router.delete('/table/:name/:id', auth, adminOnly, async (req, res) => {
  try {
    const allowed = ['attendance', 'salary', 'notifications', 'vacations', 'requests'];
    if (!allowed.includes(req.params.name)) return res.status(400).json({ error: 'Bu jadvaldan o\'chirish mumkin emas' });
    await db.run_p(`DELETE FROM ${req.params.name} WHERE id = ?`, [req.params.id]);
    res.json({ message: 'O\'chirildi' });
  } catch (err) { res.status(500).json({ error: err.message }); }
});

// Custom SQL (faqat SELECT)
router.post('/query', auth, adminOnly, async (req, res) => {
  try {
    const { sql } = req.body;
    if (!sql) return res.status(400).json({ error: 'SQL kiriting' });
    const trimmed = sql.trim().toLowerCase();
    if (!trimmed.startsWith('select')) return res.status(400).json({ error: 'Faqat SELECT so\'rovlar ruxsat etiladi' });
    const rows = await db.all_p(sql);
    res.json({ rows, count: rows.length });
  } catch (err) { res.status(500).json({ error: err.message }); }
});

module.exports = router;
