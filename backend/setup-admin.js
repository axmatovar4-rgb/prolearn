const db = require('./database');

setTimeout(async () => {
  try {
    // Admin foydalanuvchiga employee profil bog'lash
    // Avval admin employee mavjudmi tekshir
    let emp = await db.get_p('SELECT * FROM employees WHERE last_name = ? AND first_name = ?', ['Axmatova', 'Robiya']);

    if (!emp) {
      const result = await db.run_p(`
        INSERT INTO employees (first_name, last_name, middle_name, birth_date, city, position, department, hire_date, salary_type, base_salary, card_number, status)
        VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
        ['Robiya', 'Axmatova', 'Xurshidovna', '2010-01-20', 'Buxoro', 'Administrator', 'Boshqaruv', '2024-01-01', 'monthly', 10000000, '8600 0101 2010 2024', 'active']
      );
      console.log('✅ Admin profili yaratildi! ID:', result.lastID);
    } else {
      await db.run_p(`
        UPDATE employees SET middle_name=?, birth_date=?, city=?, position=?, department=?, card_number=? WHERE id=?`,
        ['Xurshidovna', '2010-01-20', 'Buxoro', 'Administrator', 'Boshqaruv', '8600 0101 2010 2024', emp.id]
      );
      console.log('✅ Admin profili yangilandi! ID:', emp.id);
    }

    // Users jadvalidagi admin ga employee_id bog'lash
    await db.run_p('ALTER TABLE users ADD COLUMN employee_id INTEGER', []).catch(() => {});
    const newEmp = await db.get_p('SELECT * FROM employees WHERE last_name = ? AND first_name = ?', ['Axmatova', 'Robiya']);
    await db.run_p('UPDATE users SET employee_id = ? WHERE username = ?', [newEmp.id, 'admin']);
    console.log('✅ Admin va profil bog\'landi');

  } catch (err) {
    console.error('Xato:', err.message);
  }
  process.exit(0);
}, 1000);
