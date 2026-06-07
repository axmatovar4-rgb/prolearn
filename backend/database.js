const sqlite3 = require('sqlite3').verbose();
const path = require('path');
const bcrypt = require('bcryptjs');

const db = new sqlite3.Database(path.join(__dirname, 'ishxona.db'));

db.run_p = (sql, params = []) => new Promise((res, rej) => db.run(sql, params, function(err) { err ? rej(err) : res(this); }));
db.get_p = (sql, params = []) => new Promise((res, rej) => db.get(sql, params, (err, row) => err ? rej(err) : res(row)));
db.all_p = (sql, params = []) => new Promise((res, rej) => db.all(sql, params, (err, rows) => err ? rej(err) : res(rows)));

db.serialize(() => {
  db.run(`CREATE TABLE IF NOT EXISTS users (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    username TEXT UNIQUE NOT NULL,
    password TEXT NOT NULL,
    role TEXT DEFAULT 'admin',
    employee_id INTEGER,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP
  )`);

  db.run(`CREATE TABLE IF NOT EXISTS employees (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    first_name TEXT NOT NULL,
    last_name TEXT NOT NULL,
    middle_name TEXT,
    phone TEXT,
    email TEXT,
    address TEXT,
    city TEXT,
    position TEXT,
    department TEXT,
    hire_date DATE,
    birth_date DATE,
    card_number TEXT,
    password_hash TEXT,
    salary_type TEXT DEFAULT 'monthly',
    base_salary REAL DEFAULT 0,
    photo TEXT,
    status TEXT DEFAULT 'active',
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP
  )`);

  db.run(`CREATE TABLE IF NOT EXISTS attendance (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    employee_id INTEGER NOT NULL,
    date DATE NOT NULL,
    status TEXT DEFAULT 'present',
    check_in TIME,
    check_out TIME,
    work_hours REAL DEFAULT 0,
    late_minutes INTEGER DEFAULT 0,
    note TEXT,
    FOREIGN KEY (employee_id) REFERENCES employees(id) ON DELETE CASCADE
  )`);

  db.run(`CREATE TABLE IF NOT EXISTS salary (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    employee_id INTEGER NOT NULL,
    month INTEGER NOT NULL,
    year INTEGER NOT NULL,
    worked_days REAL DEFAULT 0,
    worked_hours REAL DEFAULT 0,
    base_amount REAL DEFAULT 0,
    bonus REAL DEFAULT 0,
    deduction REAL DEFAULT 0,
    total_amount REAL DEFAULT 0,
    is_paid INTEGER DEFAULT 0,
    paid_date DATE,
    card_number TEXT,
    note TEXT,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (employee_id) REFERENCES employees(id) ON DELETE CASCADE
  )`);

  db.run(`CREATE TABLE IF NOT EXISTS notifications (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    employee_id INTEGER,
    type TEXT,
    title TEXT,
    message TEXT,
    is_read INTEGER DEFAULT 0,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP
  )`);

  db.run(`CREATE TABLE IF NOT EXISTS vacations (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    employee_id INTEGER NOT NULL,
    start_date DATE NOT NULL,
    end_date DATE NOT NULL,
    type TEXT DEFAULT 'annual',
    days INTEGER DEFAULT 0,
    status TEXT DEFAULT 'approved',
    note TEXT,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (employee_id) REFERENCES employees(id) ON DELETE CASCADE
  )`);

  // Yangi ustunlar (eski DB uchun)
  const alters = [
    'ALTER TABLE employees ADD COLUMN birth_date DATE',
    'ALTER TABLE employees ADD COLUMN card_number TEXT',
    'ALTER TABLE employees ADD COLUMN password_hash TEXT',
    'ALTER TABLE salary ADD COLUMN card_number TEXT',
    'ALTER TABLE salary ADD COLUMN sender_card TEXT',
    'ALTER TABLE salary ADD COLUMN payment_method TEXT DEFAULT "transfer"',
    'ALTER TABLE salary ADD COLUMN signature TEXT',
    'ALTER TABLE users ADD COLUMN employee_id INTEGER',
  ];
  alters.forEach(sql => db.run(sql, () => {}));

  // Default admin
  db.get('SELECT id FROM users WHERE username = ?', ['admin'], (err, row) => {
    if (!row) {
      const hash = bcrypt.hashSync('admin123', 10);
      db.run('INSERT INTO users (username, password, role) VALUES (?, ?, ?)', ['admin', hash, 'admin']);
      console.log('✅ Admin yaratildi: login=admin, parol=admin123');
    }
  });
});

module.exports = db;
