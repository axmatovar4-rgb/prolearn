const express = require('express');
const router = express.Router();
const db = require('../database');
const auth = require('../middleware/auth');
const multer = require('multer');
const path = require('path');
const fs = require('fs');

const uploadDir = path.join(__dirname, '../uploads/docs');
if (!fs.existsSync(uploadDir)) fs.mkdirSync(uploadDir, { recursive: true });

const storage = multer.diskStorage({
  destination: (req, file, cb) => cb(null, uploadDir),
  filename: (req, file, cb) => cb(null, Date.now() + '_' + file.originalname)
});
const upload = multer({ storage, limits: { fileSize: 10 * 1024 * 1024 } });

// Jadvallar
db.run_p(`CREATE TABLE IF NOT EXISTS employee_docs (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  employee_id INTEGER NOT NULL,
  type TEXT NOT NULL,
  name TEXT NOT NULL,
  file_path TEXT,
  expiry_date DATE,
  note TEXT,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (employee_id) REFERENCES employees(id) ON DELETE CASCADE
)`).catch(() => {});

db.run_p(`CREATE TABLE IF NOT EXISTS probation (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  employee_id INTEGER NOT NULL,
  start_date DATE NOT NULL,
  end_date DATE NOT NULL,
  status TEXT DEFAULT 'active',
  result TEXT,
  note TEXT,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (employee_id) REFERENCES employees(id) ON DELETE CASCADE
)`).catch(() => {});

// Hujjatlar
router.get('/docs/:employee_id', auth, async (req, res) => {
  try {
    res.json(await db.all_p('SELECT * FROM employee_docs WHERE employee_id=? ORDER BY created_at DESC', [req.params.employee_id]));
  } catch (err) { res.status(500).json({ error: err.message }); }
});

router.post('/docs/:employee_id', auth, upload.single('file'), async (req, res) => {
  try {
    const { type, name, expiry_date, note } = req.body;
    const file_path = req.file ? `/uploads/docs/${req.file.filename}` : null;
    const result = await db.run_p(
      'INSERT INTO employee_docs (employee_id, type, name, file_path, expiry_date, note) VALUES (?,?,?,?,?,?)',
      [req.params.employee_id, type, name, file_path, expiry_date, note]
    );
    res.json({ id: result.lastID, message: 'Qo\'shildi' });
  } catch (err) { res.status(500).json({ error: err.message }); }
});

router.delete('/docs/:id', auth, async (req, res) => {
  try {
    const doc = await db.get_p('SELECT * FROM employee_docs WHERE id=?', [req.params.id]);
    if (doc?.file_path) {
      const full = path.join(__dirname, '..', doc.file_path);
      if (fs.existsSync(full)) fs.unlinkSync(full);
    }
    await db.run_p('DELETE FROM employee_docs WHERE id=?', [req.params.id]);
    res.json({ message: 'O\'chirildi' });
  } catch (err) { res.status(500).json({ error: err.message }); }
});

// Sinov muddati
router.get('/probation/:employee_id', auth, async (req, res) => {
  try {
    res.json(await db.all_p('SELECT * FROM probation WHERE employee_id=? ORDER BY created_at DESC', [req.params.employee_id]));
  } catch (err) { res.status(500).json({ error: err.message }); }
});

router.post('/probation', auth, async (req, res) => {
  try {
    const { employee_id, start_date, end_date, note } = req.body;
    const result = await db.run_p(
      'INSERT INTO probation (employee_id, start_date, end_date, note) VALUES (?,?,?,?)',
      [employee_id, start_date, end_date, note]
    );
    res.json({ id: result.lastID, message: 'Qo\'shildi' });
  } catch (err) { res.status(500).json({ error: err.message }); }
});

router.patch('/probation/:id', auth, async (req, res) => {
  try {
    const { status, result, note } = req.body;
    await db.run_p('UPDATE probation SET status=?, result=?, note=? WHERE id=?', [status, result, note, req.params.id]);
    res.json({ message: 'Yangilandi' });
  } catch (err) { res.status(500).json({ error: err.message }); }
});

// Hujjat muddati tugayotganlar
router.get('/expiring-docs', auth, async (req, res) => {
  try {
    const rows = await db.all_p(`
      SELECT d.*, e.first_name, e.last_name FROM employee_docs d
      JOIN employees e ON d.employee_id=e.id
      WHERE d.expiry_date IS NOT NULL
        AND d.expiry_date <= DATE('now', '+30 days')
        AND d.expiry_date >= DATE('now')
      ORDER BY d.expiry_date`);
    res.json(rows);
  } catch (err) { res.status(500).json({ error: err.message }); }
});

module.exports = router;
