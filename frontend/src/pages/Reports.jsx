import { useEffect, useState } from 'react';
import api from '../api';

const MONTHS = ['','Yanvar','Fevral','Mart','Aprel','May','Iyun','Iyul','Avgust','Sentabr','Oktabr','Noyabr','Dekabr'];
const fmt = n => new Intl.NumberFormat('uz-UZ').format(Math.round(n || 0));

const SimpleBar = ({ value, max, color = 'bg-indigo-500' }) => (
  <div className="h-2 bg-slate-100 rounded-full overflow-hidden flex-1">
    <div className={`h-full ${color} rounded-full`} style={{ width: max > 0 ? `${(value/max)*100}%` : '0%' }} />
  </div>
);

export default function Reports() {
  const [year, setYear] = useState(new Date().getFullYear());
  const [deptCost, setDeptCost] = useState([]);
  const [monthlyCost, setMonthlyCost] = useState([]);
  const [turnover, setTurnover] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => { fetchAll(); }, [year]);

  const fetchAll = async () => {
    setLoading(true);
    try {
      const [d, m, t] = await Promise.all([
        api.get('/reports/department-cost', { params: { year } }),
        api.get('/reports/monthly-cost', { params: { year } }),
        api.get('/reports/turnover'),
      ]);
      setDeptCost(d.data);
      setMonthlyCost(m.data);
      setTurnover(t.data);
    } finally { setLoading(false); }
  };

  const maxDept = Math.max(...deptCost.map(d => d.total_cost || 0), 1);
  const maxMonth = Math.max(...monthlyCost.map(m => m.total || 0), 1);
  const totalYear = monthlyCost.reduce((a, m) => a + (m.total || 0), 0);
  const paidYear = monthlyCost.reduce((a, m) => a + (m.paid || 0), 0);

  return (
    <div className="p-6 space-y-6">
      <div className="flex items-center justify-between flex-wrap gap-3">
        <div>
          <h1 className="text-2xl font-bold text-slate-800 dark:text-white">HR Hisobotlar</h1>
          <p className="text-slate-500 text-sm">Tahlil va statistika</p>
        </div>
        <div className="flex gap-2">
          <select className="input w-auto" value={year} onChange={e => setYear(Number(e.target.value))}>
            {[2023,2024,2025,2026].map(y => <option key={y} value={y}>{y}</option>)}
          </select>
          <button onClick={() => window.open(`/api/reports/hr-report?year=${year}&token=${localStorage.getItem('token')}`, '_blank')}
            className="btn-primary flex items-center gap-2 text-sm">
            🖨️ Hisobot chop etish
          </button>
        </div>
      </div>

      {loading ? (
        <div className="flex justify-center py-16"><div className="animate-spin rounded-full h-10 w-10 border-b-2 border-indigo-500"></div></div>
      ) : (
        <>
          {/* Umumiy kartochkalar */}
          {turnover && (
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
              {[
                { label: 'Faol ishchilar', value: turnover.active, color: 'text-green-600', bg: 'bg-green-50' },
                { label: 'Bloklangan', value: turnover.blocked, color: 'text-red-500', bg: 'bg-red-50' },
                { label: 'Jami yillik maosh', value: `${fmt(totalYear)} so'm`, color: 'text-indigo-600', bg: 'bg-indigo-50' },
                { label: 'To\'langan', value: `${fmt(paidYear)} so'm`, color: 'text-emerald-600', bg: 'bg-emerald-50' },
              ].map((s, i) => (
                <div key={i} className={`rounded-xl p-4 ${s.bg}`}>
                  <p className={`text-xl font-bold ${s.color}`}>{s.value}</p>
                  <p className="text-slate-500 text-xs mt-1">{s.label}</p>
                </div>
              ))}
            </div>
          )}

          {/* Oylik xarajat */}
          <div className="card">
            <h2 className="font-semibold text-slate-700 dark:text-slate-200 mb-4">{year} yil oylik maosh dinamikasi</h2>
            <div className="space-y-3">
              {monthlyCost.length === 0 ? (
                <p className="text-slate-400 text-center py-8">Ma'lumot yo'q</p>
              ) : monthlyCost.map(m => (
                <div key={m.month} className="flex items-center gap-3">
                  <span className="text-sm text-slate-500 w-20 flex-shrink-0">{MONTHS[m.month]}</span>
                  <SimpleBar value={m.total} max={maxMonth} color="bg-indigo-400" />
                  <span className="text-sm font-medium text-slate-700 dark:text-slate-200 w-32 text-right flex-shrink-0">{fmt(m.total)} so'm</span>
                  <span className="text-xs text-slate-400 w-16 flex-shrink-0">{m.employees} kishi</span>
                </div>
              ))}
            </div>
          </div>

          {/* Bo'limlar xarajati */}
          <div className="card">
            <h2 className="font-semibold text-slate-700 dark:text-slate-200 mb-4">Bo'limlar bo'yicha xarajat</h2>
            <div className="space-y-4">
              {deptCost.length === 0 ? (
                <p className="text-slate-400 text-center py-8">Ma'lumot yo'q</p>
              ) : deptCost.map(d => (
                <div key={d.department}>
                  <div className="flex items-center justify-between mb-1">
                    <div className="flex items-center gap-2">
                      <span className="font-medium text-sm text-slate-700 dark:text-slate-200">{d.department || 'Noma\'lum'}</span>
                      <span className="text-xs text-slate-400">{d.employee_count} kishi</span>
                    </div>
                    <span className="text-sm font-bold text-slate-700 dark:text-slate-200">{fmt(d.total_cost)} so'm</span>
                  </div>
                  <div className="h-3 bg-slate-100 rounded-full overflow-hidden">
                    <div className="h-full bg-gradient-to-r from-indigo-400 to-purple-400 rounded-full"
                      style={{ width: `${(d.total_cost/maxDept)*100}%` }} />
                  </div>
                  <div className="flex justify-between text-xs text-slate-400 mt-1">
                    <span>O'rtacha: {fmt(d.avg_salary)} so'm</span>
                    <span>To'langan: {fmt(d.paid_cost)} so'm</span>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Kechikish statistikasi */}
          {turnover?.late_stats?.length > 0 && (
            <div className="card">
              <h2 className="font-semibold text-slate-700 dark:text-slate-200 mb-4">Kechikish statistikasi (oxirgi 6 oy)</h2>
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead className="border-b border-slate-100">
                    <tr>
                      <th className="text-left py-2 text-slate-500 font-medium">Oy</th>
                      <th className="text-right py-2 text-slate-500 font-medium">Kechikishlar</th>
                      <th className="text-right py-2 text-slate-500 font-medium">Jami daqiqa</th>
                      <th className="text-right py-2 text-slate-500 font-medium">Xodimlar</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-50">
                    {turnover.late_stats.map(s => (
                      <tr key={s.ym}>
                        <td className="py-2 text-slate-700 dark:text-slate-200">{s.ym}</td>
                        <td className="py-2 text-right text-red-500 font-medium">{s.late_count}</td>
                        <td className="py-2 text-right text-slate-600">{s.total_minutes} daq</td>
                        <td className="py-2 text-right text-slate-600">{s.late_employees} kishi</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}
        </>
      )}
    </div>
  );
}
