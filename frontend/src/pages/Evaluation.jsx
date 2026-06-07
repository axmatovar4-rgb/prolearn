import { useEffect, useState } from 'react';
import api from '../api';
import toast from 'react-hot-toast';

const MONTHS = ['','Yanvar','Fevral','Mart','Aprel','May','Iyun','Iyul','Avgust','Sentabr','Oktabr','Noyabr','Dekabr'];
const fmt = n => new Intl.NumberFormat('uz-UZ').format(Math.round(n || 0));

const Stars = ({ value, onChange }) => (
  <div className="flex gap-1">
    {[1,2,3,4,5].map(s => (
      <button key={s} type="button" onClick={() => onChange && onChange(s)}
        className={`text-2xl transition-transform hover:scale-110 ${s <= value ? 'text-yellow-400' : 'text-slate-300'}`}>★</button>
    ))}
  </div>
);

export default function Evaluation() {
  const now = new Date();
  const [employees, setEmployees] = useState([]);
  const [tab, setTab] = useState('evaluations');
  const [month, setMonth] = useState(now.getMonth() + 1);
  const [year, setYear] = useState(now.getFullYear());
  const [evals, setEvals] = useState([]);
  const [top, setTop] = useState([]);
  const [bonuses, setBonuses] = useState([]);
  const [penalties, setPenalties] = useState([]);
  const [showForm, setShowForm] = useState(false);
  const [form, setForm] = useState({ employee_id: '', rating: 5, category: 'general', comment: '' });
  const [bonusForm, setBonusForm] = useState({ employee_id: '', amount: '', reason: '' });
  const [penaltyForm, setPenaltyForm] = useState({ employee_id: '', amount: '', reason: '' });

  useEffect(() => { api.get('/employees').then(r => setEmployees(r.data)); }, []);
  useEffect(() => { fetchAll(); }, [month, year, tab]);

  const fetchAll = () => {
    api.get('/evaluation', { params: { month, year } }).then(r => setEvals(r.data));
    api.get('/evaluation/top', { params: { month, year } }).then(r => setTop(r.data));
    api.get('/evaluation/bonuses', { params: { month, year } }).then(r => setBonuses(r.data));
    api.get('/evaluation/penalties', { params: { month, year } }).then(r => setPenalties(r.data));
  };

  const addEval = async (e) => {
    e.preventDefault();
    try {
      await api.post('/evaluation', { ...form, month, year });
      toast.success('Baholash qo\'shildi');
      setShowForm(false);
      fetchAll();
    } catch { toast.error('Xatolik'); }
  };

  const addBonus = async (e) => {
    e.preventDefault();
    try {
      await api.post('/evaluation/bonuses', { ...bonusForm, month, year });
      toast.success('Bonus qo\'shildi');
      setBonusForm({ employee_id: '', amount: '', reason: '' });
      fetchAll();
    } catch { toast.error('Xatolik'); }
  };

  const addPenalty = async (e) => {
    e.preventDefault();
    try {
      await api.post('/evaluation/penalties', { ...penaltyForm, month, year });
      toast.success('Jarima qo\'shildi');
      setPenaltyForm({ employee_id: '', amount: '', reason: '' });
      fetchAll();
    } catch { toast.error('Xatolik'); }
  };

  const deleteEval = async (id) => {
    await api.delete(`/evaluation/${id}`);
    fetchAll();
  };

  return (
    <div className="p-6 space-y-5">
      <div className="flex items-center justify-between flex-wrap gap-3">
        <div>
          <h1 className="text-2xl font-bold text-slate-800 dark:text-white">Baholash va mukofotlar</h1>
          <p className="text-slate-500 text-sm">Xodimlarni baholash, bonus, jarima</p>
        </div>
        <div className="flex gap-2">
          <select className="input w-auto" value={month} onChange={e => setMonth(Number(e.target.value))}>
            {MONTHS.slice(1).map((m, i) => <option key={i} value={i+1}>{m}</option>)}
          </select>
          <select className="input w-auto" value={year} onChange={e => setYear(Number(e.target.value))}>
            {[2023,2024,2025,2026].map(y => <option key={y} value={y}>{y}</option>)}
          </select>
        </div>
      </div>

      {/* Tablar */}
      <div className="flex gap-1 bg-slate-100 dark:bg-slate-800 rounded-xl p-1">
        {[['evaluations','⭐ Baholash'],['top','🏆 Reyting'],['bonuses','🎉 Bonuslar'],['penalties','⚠️ Jarimalar']].map(([v,l]) => (
          <button key={v} onClick={() => setTab(v)}
            className={`flex-1 py-2 rounded-lg text-sm font-medium transition-colors ${tab===v?'bg-white dark:bg-slate-700 shadow text-indigo-600':'text-slate-500 hover:text-slate-700'}`}>
            {l}
          </button>
        ))}
      </div>

      {/* Baholash */}
      {tab === 'evaluations' && (
        <div className="space-y-4">
          <div className="flex justify-end">
            <button onClick={() => setShowForm(!showForm)} className="btn-primary">+ Baholash qo'shish</button>
          </div>

          {showForm && (
            <form onSubmit={addEval} className="card border-2 border-indigo-100 space-y-3">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="label">Xodim</label>
                  <select className="input" value={form.employee_id} onChange={e => setForm(f=>({...f,employee_id:e.target.value}))} required>
                    <option value="">Tanlang...</option>
                    {employees.map(e => <option key={e.id} value={e.id}>{e.last_name} {e.first_name}</option>)}
                  </select>
                </div>
                <div>
                  <label className="label">Kategoriya</label>
                  <select className="input" value={form.category} onChange={e => setForm(f=>({...f,category:e.target.value}))}>
                    <option value="general">Umumiy</option>
                    <option value="performance">Samaradorlik</option>
                    <option value="discipline">Intizom</option>
                    <option value="teamwork">Jamoaviy ish</option>
                  </select>
                </div>
                <div>
                  <label className="label">Baho</label>
                  <Stars value={form.rating} onChange={v => setForm(f=>({...f,rating:v}))} />
                </div>
                <div>
                  <label className="label">Izoh</label>
                  <input className="input" value={form.comment} onChange={e => setForm(f=>({...f,comment:e.target.value}))} />
                </div>
              </div>
              <div className="flex gap-2">
                <button type="submit" className="btn-primary text-sm">Saqlash</button>
                <button type="button" onClick={() => setShowForm(false)} className="btn-secondary text-sm">Bekor</button>
              </div>
            </form>
          )}

          <div className="card p-0 overflow-hidden">
            <table className="w-full text-sm">
              <thead className="bg-slate-50 dark:bg-slate-700 border-b">
                <tr>
                  <th className="text-left px-5 py-3 text-slate-500 font-medium">Xodim</th>
                  <th className="text-left px-5 py-3 text-slate-500 font-medium">Kategoriya</th>
                  <th className="text-center px-5 py-3 text-slate-500 font-medium">Baho</th>
                  <th className="text-left px-5 py-3 text-slate-500 font-medium">Izoh</th>
                  <th className="px-5 py-3"></th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-50 dark:divide-slate-700">
                {evals.length === 0 ? (
                  <tr><td colSpan={5} className="text-center py-8 text-slate-400">Bu oy uchun baholash yo'q</td></tr>
                ) : evals.map(ev => (
                  <tr key={ev.id} className="hover:bg-slate-50 dark:hover:bg-slate-700/50">
                    <td className="px-5 py-3 font-medium text-slate-800 dark:text-white">{ev.last_name} {ev.first_name}</td>
                    <td className="px-5 py-3 text-slate-500 capitalize">{ev.category}</td>
                    <td className="px-5 py-3 text-center text-yellow-400">{'★'.repeat(ev.rating)}{'☆'.repeat(5-ev.rating)}</td>
                    <td className="px-5 py-3 text-slate-500">{ev.comment || '—'}</td>
                    <td className="px-5 py-3">
                      <button onClick={() => deleteEval(ev.id)} className="text-xs text-red-400 hover:text-red-600">O'chirish</button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Reyting */}
      {tab === 'top' && (
        <div className="space-y-3">
          {top.map((emp, i) => (
            <div key={emp.id} className="card flex items-center gap-4 py-3">
              <div className={`w-10 h-10 rounded-full flex items-center justify-center text-lg font-bold text-white flex-shrink-0 ${i===0?'bg-yellow-400':i===1?'bg-slate-400':i===2?'bg-amber-600':'bg-indigo-300'}`}>
                {i+1}
              </div>
              <div className="flex-1">
                <p className="font-semibold text-slate-800 dark:text-white">{emp.last_name} {emp.first_name}</p>
                <p className="text-xs text-slate-500">{emp.position} — {emp.department}</p>
              </div>
              <div className="text-right">
                {emp.avg_rating ? (
                  <div className="text-yellow-400 text-lg">{'★'.repeat(Math.round(emp.avg_rating))}{'☆'.repeat(5-Math.round(emp.avg_rating))}</div>
                ) : <p className="text-slate-400 text-sm">Baholanmagan</p>}
                <p className="text-xs text-slate-400">{emp.eval_count} ta baho</p>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Bonuslar */}
      {tab === 'bonuses' && (
        <div className="space-y-4">
          <form onSubmit={addBonus} className="card border-2 border-green-100 space-y-3">
            <h3 className="font-semibold text-slate-700 dark:text-white">🎉 Bonus qo'shish</h3>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
              <div>
                <label className="label">Xodim</label>
                <select className="input" value={bonusForm.employee_id} onChange={e => setBonusForm(f=>({...f,employee_id:e.target.value}))} required>
                  <option value="">Tanlang...</option>
                  {employees.map(e => <option key={e.id} value={e.id}>{e.last_name} {e.first_name}</option>)}
                </select>
              </div>
              <div>
                <label className="label">Miqdor (so'm)</label>
                <input type="number" min="0" className="input" value={bonusForm.amount} onChange={e => setBonusForm(f=>({...f,amount:e.target.value}))} required />
              </div>
              <div>
                <label className="label">Sabab</label>
                <input className="input" value={bonusForm.reason} onChange={e => setBonusForm(f=>({...f,reason:e.target.value}))} required />
              </div>
            </div>
            <button type="submit" className="btn-success text-sm">Bonus qo'shish</button>
          </form>

          <div className="card p-0 overflow-hidden">
            <table className="w-full text-sm">
              <thead className="bg-green-50 border-b">
                <tr>
                  <th className="text-left px-5 py-3 text-slate-500 font-medium">Xodim</th>
                  <th className="text-right px-5 py-3 text-slate-500 font-medium">Miqdor</th>
                  <th className="text-left px-5 py-3 text-slate-500 font-medium">Sabab</th>
                  <th className="text-left px-5 py-3 text-slate-500 font-medium">Sana</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-50">
                {bonuses.length === 0 ? (
                  <tr><td colSpan={4} className="text-center py-8 text-slate-400">Bonus yo'q</td></tr>
                ) : bonuses.map(b => (
                  <tr key={b.id}>
                    <td className="px-5 py-3 font-medium text-slate-800 dark:text-white">{b.last_name} {b.first_name}</td>
                    <td className="px-5 py-3 text-right font-bold text-green-600">+{fmt(b.amount)}</td>
                    <td className="px-5 py-3 text-slate-500">{b.reason}</td>
                    <td className="px-5 py-3 text-slate-400 text-xs">{b.created_at?.slice(0,10)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Jarimalar */}
      {tab === 'penalties' && (
        <div className="space-y-4">
          <form onSubmit={addPenalty} className="card border-2 border-red-100 space-y-3">
            <h3 className="font-semibold text-slate-700 dark:text-white">⚠️ Jarima qo'shish</h3>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
              <div>
                <label className="label">Xodim</label>
                <select className="input" value={penaltyForm.employee_id} onChange={e => setPenaltyForm(f=>({...f,employee_id:e.target.value}))} required>
                  <option value="">Tanlang...</option>
                  {employees.map(e => <option key={e.id} value={e.id}>{e.last_name} {e.first_name}</option>)}
                </select>
              </div>
              <div>
                <label className="label">Miqdor (so'm)</label>
                <input type="number" min="0" className="input" value={penaltyForm.amount} onChange={e => setPenaltyForm(f=>({...f,amount:e.target.value}))} required />
              </div>
              <div>
                <label className="label">Sabab</label>
                <input className="input" value={penaltyForm.reason} onChange={e => setPenaltyForm(f=>({...f,reason:e.target.value}))} required />
              </div>
            </div>
            <button type="submit" className="btn-danger text-sm">Jarima qo'shish</button>
          </form>

          <div className="card p-0 overflow-hidden">
            <table className="w-full text-sm">
              <thead className="bg-red-50 border-b">
                <tr>
                  <th className="text-left px-5 py-3 text-slate-500 font-medium">Xodim</th>
                  <th className="text-right px-5 py-3 text-slate-500 font-medium">Miqdor</th>
                  <th className="text-left px-5 py-3 text-slate-500 font-medium">Sabab</th>
                  <th className="text-left px-5 py-3 text-slate-500 font-medium">Sana</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-50">
                {penalties.length === 0 ? (
                  <tr><td colSpan={4} className="text-center py-8 text-slate-400">Jarima yo'q</td></tr>
                ) : penalties.map(p => (
                  <tr key={p.id}>
                    <td className="px-5 py-3 font-medium text-slate-800 dark:text-white">{p.last_name} {p.first_name}</td>
                    <td className="px-5 py-3 text-right font-bold text-red-500">-{fmt(p.amount)}</td>
                    <td className="px-5 py-3 text-slate-500">{p.reason}</td>
                    <td className="px-5 py-3 text-slate-400 text-xs">{p.created_at?.slice(0,10)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
}
