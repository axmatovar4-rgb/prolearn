const express = require('express');
const router = express.Router();
const db = require('../database');
const auth = require('../middleware/auth');
const multer = require('multer');
const path = require('path');
const fs = require('fs');

const uploadDir = path.join(__dirname, '../uploads');
if (!fs.existsSync(uploadDir)) fs.mkdirSync(uploadDir);

const storage = multer.diskStorage({
  destination: (req, file, cb) => cb(null, uploadDir),
  filename: (req, file, cb) => cb(null, Date.now() + path.extname(file.originalname))
});
const upload = multer({ storage });

// Barcha ishchilar
router.get('/', auth, async (req, res) => {
  try {
    const { search, department, status } = req.query;
    let query = 'SELECT * FROM employees WHERE 1=1';
    const params = [];
    if (search) { query += ' AND (first_name LIKE ? OR last_name LIKE ? OR phone LIKE ?)'; params.push(`%${search}%`, `%${search}%`, `%${search}%`); }
    if (department) { query += ' AND department = ?'; params.push(department); }
    if (status) { query += ' AND status = ?'; params.push(status); }
    query += ' ORDER BY created_at DESC';
    const rows = await db.all_p(query, params);
    res.json(rows);
  } catch (err) { res.status(500).json({ error: err.message }); }
});

// Bitta ishchi
router.get('/:id', auth, async (req, res) => {
  try {
    const emp = await db.get_p('SELECT * FROM employees WHERE id = ?', [req.params.id]);
    if (!emp) return res.status(404).json({ error: 'Ishchi topilmadi' });
    res.json(emp);
  } catch (err) { res.status(500).json({ error: err.message }); }
});

// Qo'shish
router.post('/', auth, upload.single('photo'), async (req, res) => {
  try {
    const { first_name, last_name, middle_name, phone, email, address, city, position, department, hire_date, salary_type, base_salary } = req.body;
    const photo = req.file ? `/uploads/${req.file.filename}` : null;
    const result = await db.run_p(
      `INSERT INTO employees (first_name, last_name, middle_name, phone, email, address, city, position, department, hire_date, salary_type, base_salary, photo) VALUES (?,?,?,?,?,?,?,?,?,?,?,?,?)`,
      [first_name, last_name, middle_name, phone, email, address, city, position, department, hire_date, salary_type, base_salary, photo]
    );
    res.json({ id: result.lastID, message: 'Ishchi qo\'shildi' });
  } catch (err) { res.status(500).json({ error: err.message }); }
});

// Tahrirlash
router.put('/:id', auth, upload.single('photo'), async (req, res) => {
  try {
    const { first_name, last_name, middle_name, phone, email, address, city, position, department, hire_date, salary_type, base_salary, status } = req.body;
    const existing = await db.get_p('SELECT * FROM employees WHERE id = ?', [req.params.id]);
    if (!existing) return res.status(404).json({ error: 'Topilmadi' });
    const photo = req.file ? `/uploads/${req.file.filename}` : existing.photo;
    await db.run_p(
      `UPDATE employees SET first_name=?,last_name=?,middle_name=?,phone=?,email=?,address=?,city=?,position=?,department=?,hire_date=?,salary_type=?,base_salary=?,photo=?,status=? WHERE id=?`,
      [first_name, last_name, middle_name, phone, email, address, city, position, department, hire_date, salary_type, base_salary, photo, status, req.params.id]
    );
    res.json({ message: 'Yangilandi' });
  } catch (err) { res.status(500).json({ error: err.message }); }
});

// O'chirish
router.delete('/:id', auth, async (req, res) => {
  try {
    await db.run_p('DELETE FROM employees WHERE id = ?', [req.params.id]);
    res.json({ message: 'O\'chirildi' });
  } catch (err) { res.status(500).json({ error: err.message }); }
});

// Bloklash
router.patch('/:id/block', auth, async (req, res) => {
  try {
    const emp = await db.get_p('SELECT * FROM employees WHERE id=?', [req.params.id]);
    if (!emp) return res.status(404).json({ error: 'Topilmadi' });
    await db.run_p('UPDATE employees SET status=? WHERE id=?', ['blocked', req.params.id]);
    res.json({ message: 'Bloklandi' });
  } catch (err) { res.status(500).json({ error: err.message }); }
});

// Blokdan chiqarish
router.patch('/:id/unblock', auth, async (req, res) => {
  try {
    await db.run_p('UPDATE employees SET status=? WHERE id=?', ['active', req.params.id]);
    res.json({ message: 'Blokdan chiqarildi' });
  } catch (err) { res.status(500).json({ error: err.message }); }
});

// Bo'limlar
router.get('/meta/departments', auth, async (req, res) => {
  try {
    const rows = await db.all_p('SELECT DISTINCT department FROM employees WHERE department IS NOT NULL');
    res.json(rows.map(r => r.department));
  } catch (err) { res.status(500).json({ error: err.message }); }
});

module.exports = router;
