import { useEffect, useState } from 'react';
import api from '../api';
import toast from 'react-hot-toast';
import { HiSave, HiRefresh } from 'react-icons/hi';

const MONTHS = ['Yanvar','Fevral','Mart','Aprel','May','Iyun','Iyul','Avgust','Sentabr','Oktabr','Noyabr','Dekabr'];

export default function Attendance() {
  const now = new Date();
  const [month, setMonth] = useState(now.getMonth() + 1);
  const [year, setYear] = useState(now.getFullYear());
  const [employees, setEmployees] = useState([]);
  const [records, setRecords] = useState({});
  const [deletedKeys, setDeletedKeys] = useState(new Set());
  const [saving, setSaving] = useState(false);

  // Oy kunlari
  const getDays = () => {
    const days = [];
    const total = new Date(year, month, 0).getDate();
    for (let d = 1; d <= total; d++) {
      const date = `${year}-${String(month).padStart(2, '0')}-${String(d).padStart(2, '0')}`;
      const dow = new Date(date).getDay();
      days.push({ day: d, date, isWeekend: dow === 0 || dow === 6 });
    }
    return days;
  };

  const fetchData = async () => {
    const [empRes, attRes] = await Promise.all([
      api.get('/employees', { params: { status: 'active' } }),
      api.get('/attendance', { params: { month, year } })
    ]);

    setEmployees(empRes.data);

    const map = {};
    attRes.data.forEach(a => {
      const key = `${a.employee_id}_${a.date}`;
      map[key] = a.status;
    });
    setRecords(map);
    setDeletedKeys(new Set());
  };

  useEffect(() => { fetchData(); }, [month, year]);

  const toggle = (empId, date, current) => {
    const key = `${empId}_${date}`;
    let next;
    if (current === 'present') next = 'absent';
    else if (current === 'absent') next = 'half';
    else if (current === 'half') next = null; // bo'sh — o'chirish
    else next = 'present';
    setRecords(r => {
      const updated = { ...r };
      if (next === null) {
        delete updated[key];
        setDeletedKeys(prev => new Set([...prev, key]));
      } else {
        updated[key] = next;
        setDeletedKeys(prev => { const s = new Set(prev); s.delete(key); return s; });
      }
      return updated;
    });
  };

  const saveAll = async () => {
    setSaving(true);
    try {
      const days = getDays();
      // O'chirilgan yozuvlarni o'chirish (null holat)
      for (const key of deletedKeys) {
        const idx = key.indexOf('_');
        const empId = key.slice(0, idx);
        const date = key.slice(idx + 1);
        try {
          await api.post('/attendance', {
            employee_id: empId,
            date,
            status: null,
            work_hours: 0
          });
        } catch { /* ignore */ }
      }
      // Mavjud yozuvlarni saqlash
      for (const emp of employees) {
        for (const { date } of days) {
          const key = `${emp.id}_${date}`;
          const status = records[key];
          if (status) {
            await api.post('/attendance', {
              employee_id: emp.id,
              date,
              status,
              work_hours: status === 'present' ? 8 : status === 'half' ? 4 : 0
            });
          }
        }
      }
      toast.success('Saqlandi');
      setDeletedKeys(new Set());
    } catch {
      toast.error('Xatolik');
    } finally {
      setSaving(false);
    }
  };

  const days = getDays();

  const statusColor = (s) => {
    if (s === 'present') return 'bg-green-500 text-white';
    if (s === 'absent') return 'bg-red-400 text-white';
    if (s === 'half') return 'bg-yellow-400 text-white';
    return 'bg-slate-100 text-slate-300';
  };

  const statusLabel = (s) => {
    if (s === 'present') return 'K';
    if (s === 'absent') return 'X';
    if (s === 'half') return 'Y';
    return '·';
  };

  return (
    <div className="p-6 space-y-5">
      <div className="flex items-center justify-between flex-wrap gap-3">
        <div>
          <h1 className="text-2xl font-bold text-slate-800">Davomat</h1>
          <p className="text-slate-500 text-sm">K=Keldi, X=Kelmadi, Y=Yarim kun</p>
        </div>
        <div className="flex items-center gap-3 flex-wrap">
          <select className="input w-auto" value={month} onChange={e => setMonth(Number(e.target.value))}>
            {MONTHS.map((m, i) => <option key={i} value={i + 1}>{m}</option>)}
          </select>
          <select className="input w-auto" value={year} onChange={e => setYear(Number(e.target.value))}>
            {[2023, 2024, 2025, 2026].map(y => <option key={y} value={y}>{y}</option>)}
          </select>
          <button onClick={fetchData} className="btn-secondary flex items-center gap-2">
            <HiRefresh /> Yangilash
          </button>
          <button onClick={saveAll} disabled={saving} className="btn-primary flex items-center gap-2">
            <HiSave /> {saving ? 'Saqlanmoqda...' : 'Saqlash'}
          </button>
        </div>
      </div>

      <div className="card p-0 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="text-xs border-collapse w-full">
            <thead>
              <tr className="bg-slate-50">
                <th className="sticky left-0 bg-slate-50 text-left px-4 py-3 text-slate-600 font-semibold min-w-44 border-r border-slate-100">Ishchi</th>
                {days.map(({ day, date, isWeekend }) => (
                  <th key={date} className={`px-1 py-3 text-center font-medium w-8 ${isWeekend ? 'text-red-400 bg-red-50' : 'text-slate-500'}`}>
                    {day}
                  </th>
                ))}
                <th className="px-3 py-3 text-center text-slate-600 font-semibold">Jami</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-50">
              {employees.length === 0 ? (
                <tr><td colSpan={days.length + 2} className="text-center py-10 text-slate-400">Ishchilar topilmadi</td></tr>
              ) : employees.map(emp => {
                const total = days.filter(({ date }) => records[`${emp.id}_${date}`] === 'present').length;
                const half = days.filter(({ date }) => records[`${emp.id}_${date}`] === 'half').length;
                return (
                  <tr key={emp.id} className="hover:bg-slate-50">
                    <td className="sticky left-0 bg-white px-4 py-2 border-r border-slate-100 font-medium text-slate-700">
                      {emp.last_name} {emp.first_name}
                    </td>
                    {days.map(({ date, isWeekend }) => {
                      const key = `${emp.id}_${date}`;
                      const s = records[key];
                      return (
                        <td key={date} className={`p-0.5 text-center ${isWeekend ? 'bg-red-50' : ''}`}>
                          <button
                            onClick={() => toggle(emp.id, date, s)}
                            className={`w-7 h-7 rounded text-xs font-bold transition-all hover:opacity-80 ${statusColor(s)}`}
                            title={date}
                          >
                            {statusLabel(s)}
                          </button>
                        </td>
                      );
                    })}
                    <td className="px-3 py-2 text-center font-bold text-slate-700">
                      {total}<span className="text-yellow-500 ml-1">{half > 0 ? `+${half}` : ''}</span>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
