import { useEffect, useState } from 'react';
import api from '../api';

const MONTHS = ['','Yanvar','Fevral','Mart','Aprel','May','Iyun','Iyul','Avgust','Sentabr','Oktabr','Noyabr','Dekabr'];
const fmt = n => new Intl.NumberFormat('uz-UZ').format(Math.round(n || 0));

export default function SalaryHistory() {
  const [list, setList] = useState([]);
  const [employees, setEmployees] = useState([]);
  const [filterEmp, setFilterEmp] = useState('');
  const [filterYear, setFilterYear] = useState(new Date().getFullYear());
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    api.get('/employees').then(r => setEmployees(r.data)).catch(() => {});
  }, []);

  useEffect(() => { fetchData(); }, [filterEmp, filterYear]);

  const fetchData = async () => {
    setLoading(true);
    try {
      const params = { year: filterYear };
      if (filterEmp) params.employee_id = filterEmp;
      const res = await api.get('/salary/history', { params });
      setList(res.data);
    } finally { setLoading(false); }
  };

  // Xodimlar bo'yicha guruhlash
  const grouped = {};
  list.forEach(s => {
    const key = s.employee_id;
    if (!grouped[key]) grouped[key] = { name: `${s.last_name} ${s.first_name}`, position: s.position, department: s.department, months: [] };
    grouped[key].months.push(s);
  });

  const totalPaid = list.filter(s => s.is_paid).reduce((a, s) => a + (s.total_amount || 0), 0);
  const totalAll = list.reduce((a, s) => a + (s.total_amount || 0), 0);

  return (
    <div className="p-6 space-y-5">
      <div className="flex items-center justify-between flex-wrap gap-3">
        <div>
          <h1 className="text-2xl font-bold text-slate-800 dark:text-white">Maosh tarixi</h1>
          <p className="text-slate-500 text-sm">Har oygi to'lovlar ro'yxati</p>
        </div>
      </div>

      {/* Umumiy statistika */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div className="card bg-gradient-to-br from-indigo-500 to-purple-600 text-white">
          <p className="text-white/70 text-sm">Jami to'langan ({filterYear})</p>
          <p className="text-2xl font-bold mt-1">{fmt(totalPaid)} so'm</p>
        </div>
        <div className="card bg-gradient-to-br from-amber-500 to-orange-500 text-white">
          <p className="text-white/70 text-sm">To'lanmagan</p>
          <p className="text-2xl font-bold mt-1">{fmt(totalAll - totalPaid)} so'm</p>
        </div>
        <div className="card bg-gradient-to-br from-slate-600 to-slate-700 text-white">
          <p className="text-white/70 text-sm">Jami yil maoshi</p>
          <p className="text-2xl font-bold mt-1">{fmt(totalAll)} so'm</p>
        </div>
      </div>

      {/* Filterlar */}
      <div className="card flex gap-3 flex-wrap">
        <select className="input w-auto" value={filterYear} onChange={e => setFilterYear(Number(e.target.value))}>
          {[2023,2024,2025,2026].map(y => <option key={y} value={y}>{y} yil</option>)}
        </select>
        <select className="input flex-1 min-w-48" value={filterEmp} onChange={e => setFilterEmp(e.target.value)}>
          <option value="">Barcha ishchilar</option>
          {employees.map(e => <option key={e.id} value={e.id}>{e.last_name} {e.first_name}</option>)}
        </select>
      </div>

      {/* Maosh jadvali — xodim bo'yicha */}
      {loading ? (
        <div className="flex justify-center py-12">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-indigo-500"></div>
        </div>
      ) : Object.keys(grouped).length === 0 ? (
        <div className="card text-center py-12 text-slate-400">Ma'lumot yo'q</div>
      ) : Object.entries(grouped).map(([empId, data]) => (
        <div key={empId} className="card p-0 overflow-hidden">
          {/* Xodim header */}
          <div className="px-5 py-4 bg-slate-50 dark:bg-slate-700 border-b border-slate-100 dark:border-slate-600 flex items-center justify-between">
            <div>
              <h3 className="font-semibold text-slate-800 dark:text-white">{data.name}</h3>
              <p className="text-slate-500 text-xs">{data.position} — {data.department}</p>
            </div>
            <div className="text-right">
              <p className="text-xs text-slate-500">Yillik jami</p>
              <p className="font-bold text-indigo-600">{fmt(data.months.reduce((a,m) => a + (m.total_amount||0), 0))} so'm</p>
            </div>
          </div>

          {/* Oylar jadvali */}
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead className="border-b border-slate-100 dark:border-slate-600">
                <tr>
                  <th className="text-left px-5 py-2.5 text-slate-500 font-medium">Oy</th>
                  <th className="text-right px-5 py-2.5 text-slate-500 font-medium">Ishlagan kun</th>
                  <th className="text-right px-5 py-2.5 text-slate-500 font-medium">Asosiy</th>
                  <th className="text-right px-5 py-2.5 text-slate-500 font-medium">Bonus</th>
                  <th className="text-right px-5 py-2.5 text-slate-500 font-medium">Jarima</th>
                  <th className="text-right px-5 py-2.5 text-slate-500 font-medium">Jami</th>
                  <th className="text-center px-5 py-2.5 text-slate-500 font-medium">Holat</th>
                  <th className="text-left px-5 py-2.5 text-slate-500 font-medium">Sana</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-50 dark:divide-slate-700">
                {data.months.sort((a,b) => a.month - b.month).map(s => (
                  <tr key={s.id} className="hover:bg-slate-50 dark:hover:bg-slate-700/50">
                    <td className="px-5 py-3 font-medium text-slate-700 dark:text-slate-200">{MONTHS[s.month]}</td>
                    <td className="px-5 py-3 text-right text-slate-600">{s.worked_days} kun</td>
                    <td className="px-5 py-3 text-right text-slate-600">{fmt(s.base_amount)}</td>
                    <td className="px-5 py-3 text-right text-green-600">{s.bonus > 0 ? `+${fmt(s.bonus)}` : '—'}</td>
                    <td className="px-5 py-3 text-right text-red-500">{s.deduction > 0 ? `-${fmt(s.deduction)}` : '—'}</td>
                    <td className="px-5 py-3 text-right font-bold text-slate-800 dark:text-white">{fmt(s.total_amount)}</td>
                    <td className="px-5 py-3 text-center">
                      <span className={`px-2 py-0.5 rounded-full text-xs font-medium ${s.is_paid ? 'bg-green-100 text-green-700' : 'bg-amber-100 text-amber-700'}`}>
                        {s.is_paid ? '✓ To\'landi' : 'Kutilmoqda'}
                      </span>
                    </td>
                    <td className="px-5 py-3 text-slate-400 text-xs">{s.paid_date || '—'}</td>
                  </tr>
                ))}
              </tbody>
              <tfoot className="border-t-2 border-slate-200">
                <tr className="bg-slate-50 dark:bg-slate-700/50">
                  <td className="px-5 py-3 font-semibold text-slate-700 dark:text-white">Jami</td>
                  <td className="px-5 py-3 text-right font-semibold text-slate-700 dark:text-white">{data.months.reduce((a,m)=>a+(m.worked_days||0),0)} kun</td>
                  <td colSpan={3}></td>
                  <td className="px-5 py-3 text-right font-bold text-indigo-600">{fmt(data.months.reduce((a,m)=>a+(m.total_amount||0),0))}</td>
                  <td colSpan={2}></td>
                </tr>
              </tfoot>
            </table>
          </div>
        </div>
      ))}
    </div>
  );
}
