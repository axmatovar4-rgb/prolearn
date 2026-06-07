const db = require('./database');

const firstNames = ['Jasur','Bobur','Sardor','Dilshod','Ulugbek','Sanjar','Nodir','Jahongir','Sherzod','Firdavs',
  'Otabek','Bekzod','Alisher','Davron','Mirzo','Zafar','Eldor','Ravshan','Kamol','Behruz',
  'Malika','Nilufar','Shahnoza','Dilorom','Mohira','Feruza','Nargiza','Zulfiya','Barno','Kamola'];

const lastNames = ['Karimov','Rahimov','Umarov','Hasanov','Yusupov','Toshmatov','Xolmatov',
  'Nazarov','Qodirov','Mirzoev','Askarov','Ergashev','Tursunov','Abdullayev','Ismoilov'];

const departments = ['Sotuv','Moliya','IT','HR','Marketing','Logistika','Ishlab chiqarish','Boshqaruv'];

const positions = {
  'Sotuv': ['Sotuv menejeri','Sotuv vakili'],
  'Moliya': ['Buxgalter','Moliyachi'],
  'IT': ['Dasturchi','Frontend developer','Backend developer'],
  'HR': ['HR menejer','Recruiter'],
  'Marketing': ['Marketing menejer','SMM specialist'],
  'Logistika': ['Logist','Haydovchi','Omborchi'],
  'Ishlab chiqarish': ['Ishlab chiqaruvchi','Texnik'],
  'Boshqaruv': ['Menejer','Kotib']
};

const cities = ['Toshkent','Samarqand','Buxoro','Namangan','Andijon','Farg\'ona'];
const middleNames = ['Anvarovich','Baxtiyorovich','Shamsiyevich','Normatovich','Xurshidovich',
  'Anvarovna','Baxtiyorovna','Shamsiyevna','Normatovna'];

function rnd(arr) { return arr[Math.floor(Math.random() * arr.length)]; }
function rndNum(min, max) { return Math.floor(Math.random() * (max - min + 1)) + min; }

async function addRandomEmployee() {
  try {
    const firstName = rnd(firstNames);
    const lastName = rnd(lastNames);
    const dept = rnd(departments);
    const pos = rnd(positions[dept]);
    const city = rnd(cities);
    const salaryType = Math.random() > 0.3 ? 'monthly' : 'hourly';
    const baseSalary = salaryType === 'monthly' ? rndNum(2000000, 9000000) : rndNum(15000, 60000);
    const phone = `+9989${rndNum(10,99)}${rndNum(1000000,9999999)}`;
    const now = new Date();
    const hireDate = `${now.getFullYear()}-${String(now.getMonth()+1).padStart(2,'0')}-${String(now.getDate()).padStart(2,'0')}`;

    // Xodimni qo'shish
    const result = await db.run_p(
      `INSERT INTO employees (first_name, last_name, middle_name, phone, city, position, department, hire_date, salary_type, base_salary, status)
       VALUES (?,?,?,?,?,?,?,?,?,?,?)`,
      [firstName, lastName, rnd(middleNames), phone, city, pos, dept, hireDate, salaryType, baseSalary, 'active']
    );

    const empId = result.lastID;
    const month = now.getMonth() + 1;
    const year = now.getFullYear();

    // Bu oygi davomat (bugungi kun)
    const workedDays = rndNum(1, now.getDate());
    const workHours = workedDays * rndNum(7, 9);

    // Oylik maosh hisoblash
    const baseAmount = salaryType === 'monthly'
      ? (baseSalary / 26) * workedDays
      : baseSalary * workHours;

    // Salary yozuvi qo'shish (to'lanmagan)
    await db.run_p(
      `INSERT INTO salary (employee_id, month, year, worked_days, worked_hours, base_amount, total_amount, is_paid)
       VALUES (?,?,?,?,?,?,?,0)`,
      [empId, month, year, workedDays, workHours, baseAmount, baseAmount]
    );

    // Davomat yozuvlari (oxirgi bir necha kun)
    for (let d = 1; d <= Math.min(workedDays, now.getDate()); d++) {
      const date = `${year}-${String(month).padStart(2,'0')}-${String(d).padStart(2,'0')}`;
      const dow = new Date(date).getDay();
      if (dow === 0 || dow === 6) continue;
      const status = Math.random() < 0.9 ? 'present' : 'absent';
      const hours = status === 'present' ? rndNum(7, 9) : 0;
      await db.run_p(
        `INSERT OR IGNORE INTO attendance (employee_id, date, status, work_hours) VALUES (?,?,?,?)`,
        [empId, date, status, hours]
      );
    }

    // Bildirishnoma
    await db.run_p(
      'INSERT INTO notifications (employee_id, type, title, message) VALUES (?,?,?,?)',
      [null, 'new_employee', '🆕 Yangi xodim qo\'shildi',
       `${lastName} ${firstName} — ${pos} (${dept}) oylik kutmoqda`]
    );

    console.log(`✅ Yangi xodim: ${lastName} ${firstName} — ${dept} | ${Math.round(baseAmount).toLocaleString()} so'm`);
    return { name: `${lastName} ${firstName}`, dept, amount: Math.round(baseAmount) };
  } catch (err) {
    console.error('AutoWorker xatosi:', err.message);
  }
}

// Har 30 daqiqada keyingi oy uchun maosh yozuvlari yaratish
async function autoCreateNextMonthSalary() {
  try {
    const now = new Date();
    // Keyingi oy
    const nextDate = new Date(now.getFullYear(), now.getMonth() + 1, 1);
    const month = nextDate.getMonth() + 1;
    const year = nextDate.getFullYear();
    const pad = String(month).padStart(2, '0');

    const employees = await db.all_p('SELECT * FROM employees WHERE status = ?', ['active']);
    let count = 0;

    for (const emp of employees) {
      // Allaqachon bormi tekshir
      const existing = await db.get_p(
        'SELECT id FROM salary WHERE employee_id=? AND month=? AND year=?',
        [emp.id, month, year]
      );
      if (existing) continue;

      // Bu oygi davomat statistikasi (hisoblash uchun)
      const stats = await db.get_p(`
        SELECT
          SUM(CASE WHEN status='present' THEN 1 ELSE 0 END) as p,
          SUM(CASE WHEN status='half' THEN 0.5 ELSE 0 END) as h,
          SUM(work_hours) as wh
        FROM attendance
        WHERE employee_id=? AND strftime('%m',date)=? AND strftime('%Y',date)=?`,
        [emp.id, String(now.getMonth()+1).padStart(2,'0'), String(now.getFullYear())]
      );

      const worked_days = (stats?.p || 0) + (stats?.h || 0);
      const worked_hours = stats?.wh || 0;
      const base = emp.salary_type === 'monthly'
        ? (emp.base_salary / 26) * worked_days
        : emp.base_salary * worked_hours;

      await db.run_p(
        `INSERT INTO salary (employee_id, month, year, worked_days, worked_hours, base_amount, total_amount, is_paid, card_number)
         VALUES (?,?,?,?,?,?,?,0,?)`,
        [emp.id, month, year, worked_days, worked_hours, base, base, emp.card_number]
      );
      count++;
    }

    if (count > 0) {
      console.log(`💰 AutoSalary: ${month}-oy uchun ${count} ta yangi maosh yozuvi yaratildi`);
      // Adminga bildirishnoma
      await db.run_p(
        'INSERT INTO notifications (employee_id, type, title, message) VALUES (?,?,?,?)',
        [null, 'salary_auto', '💰 Maosh yangilandi',
         `${month}-oy uchun ${count} ta xodimga maosh hisoblandi`]
      ).catch(() => {});
    }
  } catch (err) {
    console.error('AutoSalary xatosi:', err.message);
  }
}

// Har 30 daqiqada ishga tushirish
function startAutoWorker() {
  console.log('🤖 AutoWorker ishga tushdi — har 30 daqiqada maosh yangilanadi');

  // 1 daqiqadan keyin birinchi ishga tushirish
  setTimeout(autoCreateNextMonthSalary, 60 * 1000);

  // Keyin har 30 daqiqada
  setInterval(autoCreateNextMonthSalary, 30 * 60 * 1000);
}

module.exports = { startAutoWorker, addRandomEmployee };
