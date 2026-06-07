const express = require('express');
const router = express.Router();
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const db = require('../database');

const SECRET = process.env.JWT_SECRET || 'ishxona_secret_key';

router.post('/login', async (req, res) => {
  try {
    const { username, password, birth_date, card_number } = req.body;
    if (!username || !password) return res.status(400).json({ error: 'Login va parol kiriting' });

    // Admin
    const admin = await db.get_p('SELECT * FROM users WHERE username = ? AND role = ?', [username, 'admin']);
    if (admin) {
      if (!bcrypt.compareSync(password, admin.password)) {
        return res.status(401).json({ error: 'Parol noto\'g\'ri' });
      }
      const adminEmp = await db.get_p('SELECT * FROM employees WHERE last_name = ? AND first_name = ?', ['Axmatova', 'Robiya']);
      const token = jwt.sign({ id: admin.id, username: admin.username, role: 'admin', employee_id: adminEmp?.id || null }, SECRET, { expiresIn: '7d' });
      return res.json({ token, user: { id: admin.id, username: admin.username, role: 'admin', employee_id: adminEmp?.id || null } });
    }

    // Xodim — telefon yoki ism bo'yicha qidirish
    let employee = await db.get_p('SELECT * FROM employees WHERE phone = ? AND status = ?', [username, 'active']);
    if (!employee) {
      const parts = username.trim().split(' ');
      if (parts.length >= 2) {
        employee = await db.get_p('SELECT * FROM employees WHERE last_name = ? AND first_name = ? AND status = ?', [parts[0], parts[1], 'active']);
      }
    }

    if (!employee) {
      // Tizimda yo'q — kirish rad etildi
      return res.status(401).json({ error: 'Siz tizimda ro\'xatdan o\'tmagan xodim emassiz. Admin bilan bog\'laning.' });
    }

    // Mavjud xodim — parol tekshirish
    if (employee.password_hash) {
      if (!bcrypt.compareSync(password, employee.password_hash)) {
        return res.status(401).json({ error: 'Parol noto\'g\'ri' });
      }
    } else {
      // Birinchi marta kirish — parolni saqlash
      const hash = bcrypt.hashSync(password, 10);
      await db.run_p('UPDATE employees SET password_hash=?, birth_date=?, card_number=? WHERE id=?',
        [hash, birth_date || employee.birth_date, card_number || employee.card_number, employee.id]);
    }

    if (birth_date) await db.run_p('UPDATE employees SET birth_date=? WHERE id=?', [birth_date, employee.id]);
    if (card_number) await db.run_p('UPDATE employees SET card_number=? WHERE id=?', [card_number, employee.id]);

    const token = jwt.sign({ id: employee.id, username, role: 'employee', employee_id: employee.id }, SECRET, { expiresIn: '7d' });
    res.json({ token, user: { id: employee.id, username, role: 'employee', employee_id: employee.id } });

  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Parol o'zgartirish
router.post('/change-password', async (req, res) => {
  try {
    const token = req.headers.authorization?.split(' ')[1];
    if (!token) return res.status(401).json({ error: 'Token kerak' });
    const decoded = jwt.verify(token, SECRET);
    const { old_password, new_password } = req.body;

    if (decoded.role === 'admin') {
      const admin = await db.get_p('SELECT * FROM users WHERE id = ?', [decoded.id]);
      if (!bcrypt.compareSync(old_password, admin.password)) return res.status(401).json({ error: 'Eski parol noto\'g\'ri' });
      await db.run_p('UPDATE users SET password=? WHERE id=?', [bcrypt.hashSync(new_password, 10), decoded.id]);
    } else {
      const emp = await db.get_p('SELECT * FROM employees WHERE id = ?', [decoded.employee_id]);
      if (emp.password_hash && !bcrypt.compareSync(old_password, emp.password_hash)) return res.status(401).json({ error: 'Eski parol noto\'g\'ri' });
      await db.run_p('UPDATE employees SET password_hash=? WHERE id=?', [bcrypt.hashSync(new_password, 10), emp.id]);
    }
    res.json({ message: 'Parol o\'zgartirildi' });
  } catch (err) { res.status(500).json({ error: err.message }); }
});

module.exports = router;
