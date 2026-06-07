import { useEffect, useState } from 'react';
import api from '../api';
import { useApp } from '../context/AppContext';

const MONTHS = ['','Yanvar','Fevral','Mart','Aprel','May','Iyun','Iyul','Avgust','Sentabr','Oktabr','Noyabr','Dekabr'];

const SimpleBar = ({ data }) => {
  if (!data || data.length === 0) return <p className="text-slate-400 dark:text-slate-500 text-center py-10">Ma'lumot yo'q</p>;
  const max = Math.max(...data.map(d => d.count), 1);
  const colors = ['#6366f1','#10b981','#f59e0b','#ef4444','#8b5cf6'];
  return (
    <div className="flex items-end gap-3 h-40 mt-2">
      {data.map((d, i) => (
        <div key={i} className="flex flex-col items-center flex-1 gap-1">
          <span className="text-xs font-bold text-slate-600 dark:text-slate-300">{d.count}</span>
          <div className="w-full rounded-t-md transition-all" style={{ height: `${(d.count/max)*100}%`, backgroundColor: colors[i%5], minHeight: 8 }} />
          <span className="text-xs text-slate-500 dark:text-slate-400 text-center leading-tight truncate w-full">{d.department || '?'}</span>
        </div>
      ))}
    </div>
  );
};

const StatCard = ({ icon, label, value, color }) => (
  <div className="card flex items-center gap-4">
    <div className={`${color} p-3 rounded-xl flex-shrink-0`}>
      <span className="text-2xl text-white">{icon}</span>
    </div>
    <div>
      <p className="text-slate-500 dark:text-slate-400 text-sm">{label}</p>
      <p className="text-2xl font-bold text-slate-800 dark:text-white">{value}</p>
    </div>
  </div>
);

export default function Dashboard() {
  const [data, setData] = useState(null);
  const { t } = useApp();

  useEffect(() => {
    api.get('/dashboard').then(r => setData(r.data));
  }, []);

  if (!data) return (
    <div className="flex items-center justify-center h-full">
      <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-indigo-600"></div>
    </div>
  );

  const fmt = n => new Intl.NumberFormat('uz-UZ').format(Math.round(n || 0));
  const paidPct = data.monthly_salary_total > 0 ? (data.monthly_salary_paid / data.monthly_salary_total) * 100 : 0;

  return (
    <div className="p-4 sm:p-6 space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-slate-800 dark:text-white">{t('home')}</h1>
        <p className="text-slate-500 dark:text-slate-400 text-sm">Umumiy ko'rinish</p>
      </div>

      <div className="grid grid-cols-1 xs:grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard icon="👥" label={t('total_employees')} value={data.total_employees} color="bg-indigo-500" />
        <StatCard icon="✅" label={t('today_present')} value={data.today_present} color="bg-green-500" />
        <StatCard icon="❌" label={t('today_absent')} value={data.today_absent} color="bg-red-500" />
        <StatCard icon="💰" label={t('monthly_salary')} value={`${fmt(data.monthly_salary_total)} so'm`} color="bg-purple-500" />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="card">
          <h2 className="font-semibold text-slate-700 dark:text-slate-200 mb-2">{t('departments')}</h2>
          <SimpleBar data={data.departments} />
        </div>

        <div className="card">
          <h2 className="font-semibold text-slate-700 dark:text-slate-200 mb-4">{t('salary_status')}</h2>
          <div className="space-y-4 mt-4">
            <div>
              <div className="flex justify-between text-sm mb-1">
                <span className="text-slate-600 dark:text-slate-400">{t('paid')}</span>
                <span className="font-medium text-green-600">{fmt(data.monthly_salary_paid)} so'm</span>
              </div>
              <div className="h-3 bg-slate-100 dark:bg-slate-700 rounded-full overflow-hidden">
                <div className="h-full bg-green-500 rounded-full transition-all" style={{ width: `${paidPct}%` }} />
              </div>
            </div>
            <div>
              <div className="flex justify-between text-sm mb-1">
                <span className="text-slate-600 dark:text-slate-400">{t('pending')}</span>
                <span className="font-medium text-orange-500">{fmt(data.monthly_salary_total - data.monthly_salary_paid)} so'm</span>
              </div>
              <div className="h-3 bg-slate-100 dark:bg-slate-700 rounded-full overflow-hidden">
                <div className="h-full bg-orange-400 rounded-full transition-all" style={{ width: `${100-paidPct}%` }} />
              </div>
            </div>
            <div className="pt-4 border-t dark:border-slate-700 flex justify-between">
              <span className="text-slate-600 dark:text-slate-400 font-medium">{t('total')}</span>
              <span className="font-bold text-slate-800 dark:text-white">{fmt(data.monthly_salary_total)} so'm</span>
            </div>
          </div>
        </div>
      </div>

      {/* Ikki oylik statistika */}
      {data.two_month_stats?.length > 0 && (
        <div className="card">
          <h2 className="font-semibold text-slate-700 dark:text-slate-200 mb-4">Ikki oylik maosh statistikasi</h2>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            {data.two_month_stats.map((s, i) => (
              <div key={i} className={`rounded-xl p-4 border ${i === 0 ? 'bg-slate-50 dark:bg-slate-700/50 border-slate-100' : 'bg-indigo-50 dark:bg-indigo-900/20 border-indigo-100'}`}>
                <div className="flex items-center justify-between mb-3">
                  <h3 className="font-semibold text-slate-700 dark:text-slate-200">{MONTHS[s.month]} {s.year}</h3>
                  {i === data.two_month_stats.length - 1 && <span className="text-xs bg-indigo-100 text-indigo-600 px-2 py-0.5 rounded-full">Bu oy</span>}
                </div>
                <div className="space-y-2 text-sm">
                  <div className="flex justify-between">
                    <span className="text-slate-500">Ishchilar</span>
                    <span className="font-medium text-slate-700 dark:text-slate-200">{s.employee_count} ta</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-slate-500">O'rtacha ish kuni</span>
                    <span className="font-medium text-slate-700 dark:text-slate-200">{Math.round(s.avg_days || 0)} kun</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-slate-500">Jami maosh</span>
                    <span className="font-bold text-slate-800 dark:text-white">{fmt(s.total_salary)} so'm</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-slate-500">To'langan</span>
                    <span className="font-medium text-green-600">{fmt(s.paid_salary)} so'm</span>
                  </div>
                  <div className="h-2 bg-slate-200 dark:bg-slate-600 rounded-full mt-2 overflow-hidden">
                    <div className="h-full bg-green-500 rounded-full"
                      style={{ width: s.total_salary > 0 ? `${(s.paid_salary/s.total_salary)*100}%` : '0%' }} />
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Top 5 ishchi */}
      {data.top_employees?.length > 0 && (
        <div className="card">
          <h2 className="font-semibold text-slate-700 dark:text-slate-200 mb-4">Bu oygi eng faol ishchilar</h2>
          <div className="space-y-3">
            {data.top_employees.map((emp, i) => (
              <div key={i} className="flex items-center gap-3">
                <div className={`w-7 h-7 rounded-full flex items-center justify-center text-xs font-bold text-white flex-shrink-0 ${i===0?'bg-yellow-400':i===1?'bg-slate-400':i===2?'bg-amber-600':'bg-indigo-400'}`}>
                  {i+1}
                </div>
                <div className="flex-1">
                  <div className="flex items-center justify-between">
                    <span className="text-sm font-medium text-slate-700 dark:text-slate-200">{emp.last_name} {emp.first_name}</span>
                    <span className="text-xs text-slate-500">{emp.present_days || 0} kun</span>
                  </div>
                  <div className="h-1.5 bg-slate-100 dark:bg-slate-700 rounded-full mt-1 overflow-hidden">
                    <div className="h-full bg-indigo-500 rounded-full"
                      style={{ width: `${Math.min(((emp.present_days||0)/26)*100,100)}%` }} />
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}