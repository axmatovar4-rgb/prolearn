const db = require('./database');

const firstNames = ['Jasur','Bobur','Sardor','Dilshod','Ulugbek','Sanjar','Nodir','Jahongir','Sherzod','Firdavs','Otabek','Bekzod','Alisher','Davron','Mirzo','Zafar','Eldor','Ravshan','Kamol','Behruz','Malika','Nilufar','Shahnoza','Dilorom','Mohira','Feruza','Nargiza','Zulfiya','Barno','Kamola','Sabohat','Hulkar','Maftuna','Gulnora','Nasiba'];

const lastNames = ['Karimov','Rahimov','Umarov','Hasanov','Yusupov','Toshmatov','Xolmatov','Nazarov','Qodirov','Mirzoev','Askarov','Ergashev','Tursunov','Abdullayev','Ismoilov','Xasanov','Normatov','Baxtiyorov','Sotvoldiyev','Rustamov'];

const departments = ['Sotuv','Moliya','IT','HR','Marketing','Logistika','Ishlab chiqarish','Boshqaruv'];

const positions = {
  'Sotuv': ['Sotuv menejeri','Sotuv vakili','Katta menejer'],
  'Moliya': ['Buxgalter','Moliyachi','Auditor'],
  'IT': ['Dasturchi','Frontend developer','Backend developer','System admin'],
  'HR': ['HR menejer','Recruiter','HR specialist'],
  'Marketing': ['Marketing menejer','SMM specialist','Designer'],
  'Logistika': ['Logist','Haydovchi','Omborchi'],
  'Ishlab chiqarish': ['Ishlab chiqaruvchi','Texnik','Sifat nazoratchisi'],
  'Boshqaruv': ['Direktor','Menejer','Kotib']
};

const cities = ['Toshkent','Samarqand','Buxoro','Namangan','Andijon','Farg\'ona','Nukus'];

function rnd(arr) { return arr[Math.floor(Math.random() * arr.length)]; }
function rndNum(min, max) { return Math.floor(Math.random() * (max - min + 1)) + min; }

async function seed() {
  console.log('🌱 50 ta ishchi qo\'shilmoqda...');

  const used = new Set();
  let count = 0;

  while (count < 50) {
    const firstName = rnd(firstNames);
    const lastName = rnd(lastNames);
    const key = `${firstName}_${lastName}_${count}`;
    if (used.has(key)) continue;
    used.add(key);

    const dept = rnd(departments);
    const pos = rnd(positions[dept]);
    const city = rnd(cities);
    const salaryType = Math.random() > 0.3 ? 'monthly' : 'hourly';
    const baseSalary = salaryType === 'monthly' ? rndNum(2000000, 8000000) : rndNum(15000, 50000);
    const hireYear = rndNum(2020, 2024);
    const hireMonth = String(rndNum(1, 12)).padStart(2, '0');
    const hireDay = String(rndNum(1, 28)).padStart(2, '0');
    const phone = `+9989${rndNum(10, 99)}${rndNum(1000000, 9999999)}`;
    const middleNames = ['Anvarovich','Baxtiyorovich','Shamsiyevich','Normatovich','Xurshidovich','Anvarovna','Baxtiyorovna','Shamsiyevna','Normatovna','Xurshidovna'];

    await db.run_p(
      `INSERT INTO employees (first_name, last_name, middle_name, phone, city, position, department, hire_date, salary_type, base_salary, status)
       VALUES (?,?,?,?,?,?,?,?,?,?,?)`,
      [firstName, lastName, rnd(middleNames), phone, city, pos, dept, `${hireYear}-${hireMonth}-${hireDay}`, salaryType, baseSalary, 'active']
    );
    count++;
  }

  // Davomat qo'shish (oxirgi 2 oy)
  const employees = await db.all_p('SELECT id FROM employees');
  const now = new Date();

  for (const emp of employees) {
    for (let m = 0; m <= 1; m++) {
      const d = new Date(now.getFullYear(), now.getMonth() - m, 1);
      const daysInMonth = new Date(d.getFullYear(), d.getMonth() + 1, 0).getDate();
      const yr = d.getFullYear();
      const mo = d.getMonth() + 1;

      for (let day = 1; day <= daysInMonth; day++) {
        const date = `${yr}-${String(mo).padStart(2,'0')}-${String(day).padStart(2,'0')}`;
        const dow = new Date(date).getDay();
        if (dow === 0 || dow === 6) continue; // dam olish kunlari

        const rand = Math.random();
        let status = 'present';
        if (rand < 0.08) status = 'absent';
        else if (rand < 0.12) status = 'half';

        const workHours = status === 'present' ? rndNum(7, 9) : status === 'half' ? 4 : 0;
        const lateMin = status === 'present' && Math.random() < 0.15 ? rndNum(5, 30) : 0;

        await db.run_p(
          `INSERT OR IGNORE INTO attendance (employee_id, date, status, work_hours, late_minutes) VALUES (?,?,?,?,?)`,
          [emp.id, date, status, workHours, lateMin]
        );
      }
    }
  }

  // Maosh hisoblash (bu oy va o'tgan oy)
  for (const emp of employees) {
    const empData = await db.get_p('SELECT * FROM employees WHERE id = ?', [emp.id]);
    for (let m = 0; m <= 1; m++) {
      const d = new Date(now.getFullYear(), now.getMonth() - m, 1);
      const mo = d.getMonth() + 1;
      const yr = d.getFullYear();
      const pad = String(mo).padStart(2, '0');

      const stats = await db.get_p(
        `SELECT SUM(CASE WHEN status='present' THEN 1 ELSE 0 END) as p, SUM(CASE WHEN status='half' THEN 0.5 ELSE 0 END) as h, SUM(work_hours) as wh FROM attendance WHERE employee_id=? AND strftime('%m',date)=? AND strftime('%Y',date)=?`,
        [emp.id, pad, String(yr)]
      );

      const worked = (stats.p || 0) + (stats.h || 0);
      const hours = stats.wh || 0;
      const base = empData.salary_type === 'monthly' ? (empData.base_salary / 26) * worked : empData.base_salary * hours;
      const bonus = Math.random() < 0.2 ? rndNum(100000, 500000) : 0;
      const total = base + bonus;
      const isPaid = m === 1 ? 1 : 0;

      await db.run_p(
        `INSERT OR IGNORE INTO salary (employee_id, month, year, worked_days, worked_hours, base_amount, bonus, total_amount, is_paid) VALUES (?,?,?,?,?,?,?,?,?)`,
        [emp.id, mo, yr, worked, hours, base, bonus, total, isPaid]
      );
    }
  }

  console.log('✅ 50 ta ishchi, davomat va maosh ma\'lumotlari qo\'shildi!');
  process.exit(0);
}

seed().catch(err => { console.error(err); process.exit(1); });
