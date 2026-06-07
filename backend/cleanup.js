const db = require('./database');

setTimeout(async () => {
  try {
    // Robiya Axmatova (admin profili) ni saqlab, qolganlarini o'chirish
    const admin = await db.get_p('SELECT * FROM employees WHERE last_name=? AND first_name=?', ['Axmatova', 'Robiya']);
    const adminId = admin?.id;

    console.log(`Admin profil ID: ${adminId} — saqlanadi`);

    // Barcha ishchilarni o'chirish (admin profili bundan mustasno)
    const result = await db.run_p(
      `DELETE FROM employees WHERE id != ? AND status IN ('active', 'blocked', 'inactive')`,
      [adminId || 0]
    );
    console.log(`✅ ${result.changes} ta ishchi o'chirildi`);

    // Davomat, maosh, bildirishnomalar, so'rovlar — kaskad o'chadi
    // (FOREIGN KEY ON DELETE CASCADE)

    // Bildirishnomalarni ham tozalash
    await db.run_p('DELETE FROM notifications');
    console.log('✅ Bildirishnomalar tozalandi');

    // Maosh yozuvlarini tozalash
    await db.run_p('DELETE FROM salary WHERE employee_id != ?', [adminId || 0]);
    console.log('✅ Maosh yozuvlari tozalandi');

    // Davomatni tozalash
    await db.run_p('DELETE FROM attendance WHERE employee_id != ?', [adminId || 0]);
    console.log('✅ Davomat yozuvlari tozalandi');

    // Xabarlar va e'lonlar
    await db.run_p('DELETE FROM messages').catch(() => {});
    await db.run_p('DELETE FROM announcements').catch(() => {});
    console.log('✅ Xabarlar tozalandi');

    // So'rovlar
    await db.run_p('DELETE FROM requests').catch(() => {});
    console.log('✅ So\'rovlar tozalandi');

    // Qolgan ishchilar soni
    const remaining = await db.get_p('SELECT COUNT(*) as c FROM employees');
    console.log(`\n📊 Qolgan ishchilar: ${remaining.c} ta`);
    console.log('✅ Tozalash tugadi!');

  } catch (err) {
    console.error('Xato:', err.message);
  }
  process.exit(0);
}, 1000);
