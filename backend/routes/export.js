const express = require('express');
const router = express.Router();
const db = require('../database');
const auth = require('../middleware/auth');
const jwt = require('jsonwebtoken');
const SECRET = process.env.JWT_SECRET || 'ishxona_secret_key';

// Export uchun maxsus auth — URL token ham qabul qiladi
const exportAuth = (req, res, next) => {
  const token = req.headers.authorization?.split(' ')[1] || req.query.token;
  if (!token) return res.status(401).send('Token kerak');
  try {
    req.user = jwt.verify(token, SECRET);
    next();
  } catch {
    res.status(401).send('Token yaroqsiz');
  }
};

const MONTHS = ['','Yanvar','Fevral','Mart','Aprel','May','Iyun','Iyul','Avgust','Sentabr','Oktabr','Noyabr','Dekabr'];

// Maosh hisoboti — HTML
router.get('/salary-report', exportAuth, async (req, res) => {
  try {
    const { month, year } = req.query;
    const list = await db.all_p(`
      SELECT s.*, e.first_name, e.last_name, e.position, e.department, e.card_number
      FROM salary s JOIN employees e ON s.employee_id=e.id
      WHERE s.month=? AND s.year=? ORDER BY e.last_name`,
      [month, year]);

    const total = list.reduce((a, r) => a + (r.total_amount || 0), 0);
    const paid = list.filter(r => r.is_paid).reduce((a, r) => a + (r.total_amount || 0), 0);
    const fmt = n => new Intl.NumberFormat('uz-UZ').format(Math.round(n || 0));

    const rows = list.map((r, i) => `
      <tr>
        <td>${i + 1}</td>
        <td>${r.last_name} ${r.first_name}</td>
        <td>${r.position || ''}</td>
        <td>${r.department || ''}</td>
        <td style="text-align:right">${r.worked_days}</td>
        <td style="text-align:right">${fmt(r.base_amount)}</td>
        <td style="text-align:right">${r.bonus > 0 ? fmt(r.bonus) : '—'}</td>
        <td style="text-align:right">${r.deduction > 0 ? fmt(r.deduction) : '—'}</td>
        <td style="text-align:right"><b>${fmt(r.total_amount)}</b></td>
        <td style="text-align:center">${r.card_number || '—'}</td>
        <td style="text-align:center">${r.is_paid ? '✓' : '—'}</td>
      </tr>`).join('');

    const html = `<!DOCTYPE html>
<html lang="uz">
<head>
<meta charset="UTF-8">
<title>Maosh hisoboti — ${MONTHS[month]} ${year}</title>
<style>
  body { font-family: Arial, sans-serif; font-size: 12px; margin: 20px; }
  h2 { text-align: center; }
  table { width: 100%; border-collapse: collapse; margin-top: 16px; }
  th, td { border: 1px solid #ddd; padding: 6px 8px; }
  th { background: #f0f0f0; font-weight: bold; }
  tfoot td { font-weight: bold; background: #f9f9f9; }
  .info { margin-bottom: 12px; color: #555; }
  @media print { button { display: none; } }
</style>
</head>
<body>
<button onclick="window.print()" style="padding:8px 16px;background:#6366f1;color:white;border:none;border-radius:6px;cursor:pointer;margin-bottom:12px">🖨️ Chop etish</button>
<h2>Maosh hisoboti — ${MONTHS[month]} ${year}</h2>
<div class="info">Jami ishchilar: ${list.length} | To'langan: ${list.filter(r=>r.is_paid).length} | Jami summa: ${fmt(total)} so'm | To'langan: ${fmt(paid)} so'm</div>
<table>
  <thead>
    <tr>
      <th>#</th><th>F.I.O</th><th>Lavozim</th><th>Bo'lim</th>
      <th>Kun</th><th>Asosiy</th><th>Bonus</th><th>Jarima</th>
      <th>Jami</th><th>Karta</th><th>To'landi</th>
    </tr>
  </thead>
  <tbody>${rows}</tbody>
  <tfoot>
    <tr>
      <td colspan="8" style="text-align:right">Jami:</td>
      <td style="text-align:right">${fmt(total)}</td>
      <td colspan="2"></td>
    </tr>
  </tfoot>
</table>
</body></html>`;

    res.setHeader('Content-Type', 'text/html; charset=utf-8');
    res.send(html);
  } catch (err) { res.status(500).json({ error: err.message }); }
});

// Maosh cheki — bitta xodim
router.get('/salary-slip/:id', exportAuth, async (req, res) => {
  try {
    const record = await db.get_p(`
      SELECT s.*, e.first_name, e.last_name, e.middle_name, e.position, e.department, e.card_number
      FROM salary s JOIN employees e ON s.employee_id=e.id WHERE s.id=?`, [req.params.id]);
    if (!record) return res.status(404).send('Topilmadi');

    const fmt = n => new Intl.NumberFormat('uz-UZ').format(Math.round(n || 0));
    const html = `<!DOCTYPE html>
<html lang="uz">
<head>
<meta charset="UTF-8">
<title>Maosh cheki</title>
<style>
  body { font-family: Arial; font-size: 13px; max-width: 400px; margin: 30px auto; padding: 20px; border: 2px solid #6366f1; border-radius: 12px; }
  h2 { text-align: center; color: #6366f1; margin: 0 0 16px; }
  .row { display: flex; justify-content: space-between; padding: 6px 0; border-bottom: 1px solid #eee; }
  .total { font-size: 18px; font-weight: bold; color: #6366f1; }
  .badge { background: #d1fae5; color: #065f46; padding: 2px 8px; border-radius: 20px; font-size: 11px; }
  @media print { button { display: none; } }
</style>
</head>
<body>
<button onclick="window.print()" style="width:100%;padding:8px;background:#6366f1;color:white;border:none;border-radius:6px;cursor:pointer;margin-bottom:16px">🖨️ Chop etish</button>
<h2>💰 Maosh cheki</h2>
<div class="row"><span>Xodim:</span><b>${record.last_name} ${record.first_name}</b></div>
<div class="row"><span>Lavozim:</span><span>${record.position || '—'}</span></div>
<div class="row"><span>Bo'lim:</span><span>${record.department || '—'}</span></div>
<div class="row"><span>Oy:</span><span>${MONTHS[record.month]} ${record.year}</span></div>
<div class="row"><span>Ishlagan kunlar:</span><span>${record.worked_days} kun</span></div>
<div class="row"><span>Asosiy maosh:</span><span>${fmt(record.base_amount)} so'm</span></div>
${record.bonus > 0 ? `<div class="row"><span>Bonus:</span><span style="color:green">+${fmt(record.bonus)} so'm</span></div>` : ''}
${record.deduction > 0 ? `<div class="row"><span>Jarima:</span><span style="color:red">-${fmt(record.deduction)} so'm</span></div>` : ''}
<div class="row total"><span>JAMI:</span><span>${fmt(record.total_amount)} so'm</span></div>
<div class="row"><span>Karta:</span><span>${record.card_number || '—'}</span></div>
<div class="row"><span>Holat:</span><span class="badge">${record.is_paid ? '✓ To\'langan — ' + (record.paid_date || '') : 'Kutilmoqda'}</span></div>
<div class="row"><span>To'lov usuli:</span><span>${record.payment_method === 'cash' ? '💵 Naqd' : '💳 O\'tkazma'}</span></div>
${record.payment_method === 'cash' && record.signature ? `
<div style="margin-top:16px;border-top:1px solid #eee;padding-top:12px">
  <p style="font-size:11px;color:#888;margin-bottom:6px">Xodimning imzosi:</p>
  <img src="${record.signature}" style="max-width:200px;border:1px solid #ddd;border-radius:6px" />
</div>` : ''}
${record.payment_method === 'cash' ? `
<div style="margin-top:16px;border-top:1px solid #eee;padding-top:12px;display:flex;justify-content:space-between">
  <div style="text-align:center">
    <div style="width:120px;border-bottom:1px solid #333;height:30px"></div>
    <p style="font-size:11px;color:#888;margin-top:4px">Beruvchi imzosi</p>
  </div>
  <div style="text-align:center">
    <div style="width:120px;border-bottom:1px solid #333;height:30px">${record.signature ? '<img src="'+record.signature+'" style="height:30px"/>' : ''}</div>
    <p style="font-size:11px;color:#888;margin-top:4px">Qabul qiluvchi imzosi</p>
  </div>
</div>` : ''}
</body></html>`;

    res.setHeader('Content-Type', 'text/html; charset=utf-8');
    res.send(html);
  } catch (err) { res.status(500).json({ error: err.message }); }
});

module.exports = router;
