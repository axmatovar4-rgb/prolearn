import { useEffect, useState } from 'react';
import api from '../api';
import toast from 'react-hot-toast';

const MONTHS = ['Yanvar','Fevral','Mart','Aprel','May','Iyun','Iyul','Avgust','Sentabr','Oktabr','Noyabr','Dekabr'];

const SHIFTS = {
  day:   { label: '☀️ Kunduzgi', color: 'bg-yellow-100 text-yellow-700', time: '09:00–18:00' },
  night: { label: '🌙 Tungi', color: 'bg-indigo-100 text-indigo-700', time: '22:00–06:00' },
  flex:  { label: '🔄 Erkin', color: 'bg-green-100 text-green-700', time: 'Erkin' },
  off:   { label: '🏖️ Dam olish', color: 'bg-slate-100 text-slate-500', time: '—' },
};

export default function Schedule() {
  const now = new Date();
  const [month, setMonth] = useState(now.getMonth() + 1);
  const [year, setYear] = useState(now.getFullYear());
  const [employees, setEmployees] = useState([]);
  const [schedules, setSchedules] = useState({});
  const [selEmp, setSelEmp] = useState('all');
  const [saving, setSaving] = useState(false);
  const [changes, setChanges] = useState({});
  const [showBulk, setShowBulk] = useState(false);
  const [bulkShift, setBulkShift] = useState('day');

  useEffect(() => {
    api.get('/employees').then(r => setEmployees(r.data));
  }, []);

  useEffect(() => { fetchSchedules(); }, [month, year, selEmp]);

  const fetchSchedules = async () => {
    const params = { month, year };
    if (selEmp !== 'all') params.employee_id = selEmp;
    const res = await api.get('/schedule', { params });
    const map = {};
    res.data.forEach(s => {
      map[`${s.employee_id}_${s.date}`] = s;
    });
    setSchedules(map);
    setChanges({});
  };

  const getDays = () => {
    const days = [];
    const total = new Date(year, month, 0).getDate();
    for (let d = 1; d <= total; d++) {
      const date = `${year}-${String(month).padStart(2,'0')}-${String(d).padStart(2,'0')}`;
      const dow = new Date(date).getDay();
      days.push({ day: d, date, isWeekend: dow === 0 || dow === 6 });
    }
    return days;
  };

  const toggleShift = (empId, date) => {
    const key = `${empId}_${date}`;
    const current = changes[key]?.shift || schedules[key]?.shift || 'day';
    const order = ['day', 'night', 'flex', 'off'];
    const next = order[(order.indexOf(current) + 1) % order.length];
    setChanges(c => ({ ...c, [key]: { employee_id: empId, date, shift: next } }));
  };

  const saveAll = async () => {
    setSaving(true);
    try {
      for (const [, item] of Object.entries(changes)) {
        await api.post('/schedule', item);
      }
      toast.success('Jadval saqlandi');
      fetchSchedules();
    } catch { toast.error('Xatolik'); }
    finally { setSaving(false); }
  };

  const bulkCreate = async () => {
    try {
      const empIds = selEmp === 'all' ? employees.map(e => e.id) : [Number(selEmp)];
      await api.post('/schedule/bulk', { employees: empIds, month, year, shift: bulkShift });
      toast.success('Jadval yaratildi');
      fetchSchedules();
      setShowBulk(false);
    } catch { toast.error('Xatolik'); }
  };

  const days = getDays();
  const displayEmps = selEmp === 'all' ? employees : employees.filter(e => String(e.id) === selEmp);

  const getShift = (empId, date) => {
    const key = `${empId}_${date}`;
    return changes[key]?.shift || schedules[key]?.shift;
  };

  return (
    <div className="p-6 space-y-5">
      <div className="flex items-center justify-between flex-wrap gap-3">
        <div>
          <h1 className="text-2xl font-bold text-slate-800 dark:text-white">Ish jadvali</h1>
          <p className="text-slate-500 text-sm">Smenali ish jadvali boshqaruvi</p>
        </div>
        <div className="flex gap-2 flex-wrap">
          <select className="input w-auto" value={month} onChange={e => setMonth(Number(e.target.value))}>
            {MONTHS.map((m, i) => <option key={i} value={i+1}>{m}</option>)}
          </select>
          <select className="input w-auto" value={year} onChange={e => setYear(Number(e.target.value))}>
            {[2023,2024,2025,2026].map(y => <option key={y} value={y}>{y}</option>)}
          </select>
          <select className="input w-auto" value={selEmp} onChange={e => setSelEmp(e.target.value)}>
            <option value="all">Barcha ishchilar</option>
            {employees.map(e => <option key={e.id} value={e.id}>{e.last_name} {e.first_name}</option>)}
          </select>
          <button onClick={() => setShowBulk(!showBulk)} className="btn-secondary text-sm">⚡ Ommaviy</button>
          {Object.keys(changes).length > 0 && (
            <button onClick={saveAll} disabled={saving} className="btn-primary text-sm">
              {saving ? 'Saqlanmoqda...' : `💾 Saqlash (${Object.keys(changes).length})`}
            </button>
          )}
        </div>
      </div>

      {/* Izoh */}
      <div className="flex gap-3 flex-wrap">
        {Object.entries(SHIFTS).map(([k, v]) => (
          <span key={k} className={`px-2 py-1 rounded-lg text-xs font-medium ${v.color}`}>{v.label} {v.time}</span>
        ))}
      </div>

      {/* Ommaviy jadval */}
      {showBulk && (
        <div className="card border-2 border-indigo-100 flex items-center gap-4 flex-wrap">
          <div>
            <label className="label text-xs">Smena</label>
            <select className="input w-auto" value={bulkShift} onChange={e => setBulkShift(e.target.value)}>
              {Object.entries(SHIFTS).map(([k, v]) => <option key={k} value={k}>{v.label}</option>)}
            </select>
          </div>
          <div className="mt-5">
            <button onClick={bulkCreate} className="btn-primary text-sm">Oy uchun jadval yaratish</button>
          </div>
          <p className="text-xs text-slate-400 mt-5">Dam olish kunlari avtomatik "Dam olish" sifatida belgilanadi</p>
        </div>
      )}

      {/* Jadval */}
      <div className="card p-0 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="text-xs border-collapse w-full">
            <thead>
              <tr className="bg-slate-50 dark:bg-slate-700">
                <th className="sticky left-0 bg-slate-50 dark:bg-slate-700 text-left px-4 py-3 text-slate-600 font-semibold min-w-44 border-r border-slate-100">Ishchi</th>
                {days.map(({ day, date, isWeekend }) => (
                  <th key={date} className={`px-1 py-3 text-center font-medium w-9 ${isWeekend ? 'text-red-400 bg-red-50' : 'text-slate-500'}`}>
                    {day}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-50">
              {displayEmps.length === 0 ? (
                <tr><td colSpan={days.length + 1} className="text-center py-10 text-slate-400">Ishchilar yo'q</td></tr>
              ) : displayEmps.map(emp => (
                <tr key={emp.id} className="hover:bg-slate-50 dark:hover:bg-slate-700/30">
                  <td className="sticky left-0 bg-white dark:bg-slate-800 px-4 py-2 border-r border-slate-100 font-medium text-slate-700 dark:text-slate-200">
                    {emp.last_name} {emp.first_name}
                  </td>
                  {days.map(({ date, isWeekend }) => {
                    const shift = getShift(emp.id, date);
                    const shiftInfo = SHIFTS[shift];
                    const isChanged = changes[`${emp.id}_${date}`];
                    return (
                      <td key={date} className={`p-0.5 text-center ${isWeekend ? 'bg-red-50/50' : ''}`}>
                        <button
                          onClick={() => toggleShift(emp.id, date)}
                          title={shiftInfo ? shiftInfo.label : 'Belgilanmagan'}
                          className={`w-8 h-8 rounded text-xs font-bold transition-all hover:opacity-80 ${isChanged ? 'ring-2 ring-indigo-400' : ''} ${shiftInfo ? shiftInfo.color : 'bg-slate-100 text-slate-300'}`}>
                          {shift === 'day' ? '☀️' : shift === 'night' ? '🌙' : shift === 'flex' ? '🔄' : shift === 'off' ? '🏖️' : '·'}
                        </button>
                      </td>
                    );
                  })}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
