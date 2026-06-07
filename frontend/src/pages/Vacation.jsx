import { useEffect, useState } from 'react';
import api from '../api';
import toast from 'react-hot-toast';

const TYPES = { annual: 'Yillik ta\'til', sick: 'Kasallik', unpaid: 'Haqsiz ta\'til', other: 'Boshqa' };

export default function Vacation() {
  const [list, setList] = useState([]);
  const [employees, setEmployees] = useState([]);
  const [showForm, setShowForm] = useState(false);
  const [form, setForm] = useState({ employee_id: '', start_date: '', end_date: '', type: 'annual', note: '' });
  const [balance, setBalance] = useState({});
  const [filterEmp, setFilterEmp] = useState('');

  const fetch = async () => {
    const params = {};
    if (filterEmp) params.employee_id = filterEmp;
    const [vRes, eRes] = await Promise.all([
      api.get('/vacation', { params }),
      api.get('/employees')
    ]);
    setList(vRes.data);
    setEmployees(eRes.data);
  };

  useEffect(() => { fetch(); }, [filterEmp]);

  const loadBalance = async (empId) => {
    if (!empId) return;
    const res = await api.get(`/vacation/balance/${empId}`);
    setBalance(res.data);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      const res = await api.post('/vacation', form);
      toast.success(`Ta'til qo'shildi — ${res.data.days} kun`);
      setShowForm(false);
      setForm({ employee_id: '', start_date: '', end_date: '', type: 'annual', note: '' });
      fetch();
    } catch (err) { toast.error(err.response?.data?.error || 'Xatolik'); }
  };

  const del = async (id) => {
    if (!confirm('O\'chirishni tasdiqlaysizmi?')) return;
    await api.delete(`/vacation/${id}`);
    toast.success('O\'chirildi');
    fetch();
  };

  return (
    <div className="p-6 space-y-5">
      <div className="flex items-center justify-between flex-wrap gap-3">
        <div>
          <h1 className="text-2xl font-bold text-slate-800">Ta'til boshqaruvi</h1>
          <p className="text-slate-500 text-sm">{list.length} ta yozuv</p>
        </div>
        <button onClick={() => setShowForm(!showForm)} className="btn-primary flex items-center gap-2">
          <svg xmlns="http://www.w3.org/2000/svg" className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
          </svg>
          Yangi ta'til
        </button>
      </div>

      {showForm && (
        <div className="card border-2 border-indigo-100">
          <h3 className="font-semibold text-slate-700 mb-4">Ta'til qo'shish</h3>
          <form onSubmit={handleSubmit} className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="label">Xodim</label>
              <select className="input" value={form.employee_id}
                onChange={e => { setForm(f => ({ ...f, employee_id: e.target.value })); loadBalance(e.target.value); }} required>
                <option value="">Tanlang...</option>
                {employees.map(e => <option key={e.id} value={e.id}>{e.last_name} {e.first_name}</option>)}
              </select>
              {balance.remaining !== undefined && (
                <p className="text-xs text-indigo-600 mt-1">Qolgan ta'til: {balance.remaining} kun (yillik 24 kundan)</p>
              )}
            </div>
            <div>
              <label className="label">Ta'til turi</label>
              <select className="input" value={form.type} onChange={e => setForm(f => ({ ...f, type: e.target.value }))}>
                {Object.entries(TYPES).map(([k, v]) => <option key={k} value={k}>{v}</option>)}
              </select>
            </div>
            <div>
              <label className="label">Boshlanish</label>
              <input type="date" className="input" value={form.start_date}
                onChange={e => setForm(f => ({ ...f, start_date: e.target.value }))} required />
            </div>
            <div>
              <label className="label">Tugash</label>
              <input type="date" className="input" value={form.end_date}
                onChange={e => setForm(f => ({ ...f, end_date: e.target.value }))} required />
            </div>
            <div className="sm:col-span-2">
              <label className="label">Izoh</label>
              <input className="input" placeholder="Ixtiyoriy..." value={form.note}
                onChange={e => setForm(f => ({ ...f, note: e.target.value }))} />
            </div>
            <div className="sm:col-span-2 flex gap-3">
              <button type="submit" className="btn-primary">Saqlash</button>
              <button type="button" onClick={() => setShowForm(false)} className="btn-secondary">Bekor</button>
            </div>
          </form>
        </div>
      )}

      {/* Filter */}
      <div className="card flex gap-3">
        <select className="input w-auto flex-1 max-w-xs" value={filterEmp} onChange={e => setFilterEmp(e.target.value)}>
          <option value="">Barcha ishchilar</option>
          {employees.map(e => <option key={e.id} value={e.id}>{e.last_name} {e.first_name}</option>)}
        </select>
      </div>

      {/* Jadval */}
      <div className="card p-0 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead className="bg-slate-50 border-b">
              <tr>
                <th className="text-left px-5 py-3 text-slate-600 font-medium">Xodim</th>
                <th className="text-left px-5 py-3 text-slate-600 font-medium">Tur</th>
                <th className="text-left px-5 py-3 text-slate-600 font-medium">Boshlanish</th>
                <th className="text-left px-5 py-3 text-slate-600 font-medium">Tugash</th>
                <th className="text-center px-5 py-3 text-slate-600 font-medium">Kunlar</th>
                <th className="text-left px-5 py-3 text-slate-600 font-medium">Izoh</th>
                <th className="text-right px-5 py-3 text-slate-600 font-medium">Amal</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-50">
              {list.length === 0 ? (
                <tr><td colSpan={7} className="text-center py-10 text-slate-400">Ta'til yozuvlari yo'q</td></tr>
              ) : list.map(v => (
                <tr key={v.id} className="hover:bg-slate-50">
                  <td className="px-5 py-3 font-medium text-slate-800">{v.last_name} {v.first_name}</td>
                  <td className="px-5 py-3">
                    <span className="px-2 py-0.5 bg-indigo-50 text-indigo-700 rounded-full text-xs">{TYPES[v.type] || v.type}</span>
                  </td>
                  <td className="px-5 py-3 text-slate-600">{v.start_date}</td>
                  <td className="px-5 py-3 text-slate-600">{v.end_date}</td>
                  <td className="px-5 py-3 text-center font-bold text-slate-700">{v.days}</td>
                  <td className="px-5 py-3 text-slate-500">{v.note || '—'}</td>
                  <td className="px-5 py-3 text-right">
                    <button onClick={() => del(v.id)} className="p-1.5 text-slate-400 hover:text-red-500 hover:bg-red-50 rounded-lg transition-colors">
                      <svg xmlns="http://www.w3.org/2000/svg" className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                      </svg>
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
