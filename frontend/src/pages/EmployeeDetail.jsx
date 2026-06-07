import { useEffect, useState } from 'react';
import { Link, useParams } from 'react-router-dom';
import api from '../api';
import { HiArrowLeft, HiPencil, HiPhone, HiMail, HiLocationMarker, HiCalendar, HiUser } from 'react-icons/hi';

const SimpleBar = ({ data }) => {
  if (!data || data.length === 0) return null;
  const max = Math.max(...data.map(d => d.soat), 1);
  return (
    <div className="flex items-end gap-1 h-32">
      {data.map((d, i) => (
        <div key={i} className="flex flex-col items-center flex-1 gap-1">
          <div
            className="w-full rounded-t bg-blue-500 transition-all"
            style={{ height: `${(d.soat / max) * 100}%`, minHeight: d.soat > 0 ? 4 : 0 }}
          />
          <span className="text-xs text-slate-400">{d.date}</span>
        </div>
      ))}
    </div>
  );
};

export default function EmployeeDetail() {
  const { id } = useParams();
  const [emp, setEmp] = useState(null);
  const [attendance, setAttendance] = useState([]);
  const [stats, setStats] = useState(null);

  const now = new Date();
  const month = now.getMonth() + 1;
  const year = now.getFullYear();

  useEffect(() => {
    api.get(`/employees/${id}`).then(r => setEmp(r.data));
    api.get(`/attendance/employee/${id}`, { params: { month, year } }).then(r => setAttendance(r.data));
    api.get(`/attendance/stats/${id}`, { params: { month, year } }).then(r => setStats(r.data));
  }, [id]);

  if (!emp) return (
    <div className="flex items-center justify-center h-full">
      <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-blue-600"></div>
    </div>
  );

  const fmt = n => new Intl.NumberFormat('uz-UZ').format(n || 0);
  const chartData = attendance.slice(0, 20).reverse().map(a => ({ date: a.date.slice(8), soat: a.work_hours || 0 }));

  return (
    <div className="p-6 space-y-5 max-w-4xl">
      <div className="flex items-center gap-3">
        <Link to="/employees" className="p-2 hover:bg-slate-200 rounded-lg transition-colors">
          <HiArrowLeft className="text-slate-600" />
        </Link>
        <h1 className="text-xl font-bold text-slate-800 flex-1">Ishchi profili</h1>
        <Link to={`/employees/${id}/edit`} className="btn-primary flex items-center gap-2">
          <HiPencil /> Tahrirlash
        </Link>
      </div>

      {/* Profil */}
      <div className="card">
        <div className="flex items-start gap-6 flex-wrap">
          <div className="w-24 h-24 rounded-2xl bg-blue-100 overflow-hidden flex items-center justify-center flex-shrink-0">
            {emp.photo ? (
              <img src={emp.photo} alt="" className="w-full h-full object-cover" />
            ) : (
              <HiUser className="text-blue-400 text-4xl" />
            )}
          </div>
          <div className="flex-1">
            <h2 className="text-2xl font-bold text-slate-800">{emp.last_name} {emp.first_name} {emp.middle_name}</h2>
            <p className="text-blue-600 font-medium mt-1">{emp.position || 'Lavozim ko\'rsatilmagan'}</p>
            <span className={`inline-block mt-2 px-3 py-0.5 rounded-full text-xs font-medium ${emp.status === 'active' ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'}`}>
              {emp.status === 'active' ? '● Faol' : '● Nofaol'}
            </span>
          </div>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 mt-6 pt-6 border-t border-slate-100">
          {emp.phone && <div className="flex items-center gap-2 text-slate-600"><HiPhone className="text-slate-400" /> {emp.phone}</div>}
          {emp.email && <div className="flex items-center gap-2 text-slate-600"><HiMail className="text-slate-400" /> {emp.email}</div>}
          {emp.city && <div className="flex items-center gap-2 text-slate-600"><HiLocationMarker className="text-slate-400" /> {emp.city}{emp.address ? `, ${emp.address}` : ''}</div>}
          {emp.hire_date && <div className="flex items-center gap-2 text-slate-600"><HiCalendar className="text-slate-400" /> Ish boshlagan: {emp.hire_date}</div>}
          {emp.department && <div className="flex items-center gap-2 text-slate-600"><span className="text-slate-400">📁</span> Bo'lim: {emp.department}</div>}
          <div className="flex items-center gap-2 text-slate-600">
            <span className="text-slate-400">💰</span>
            {emp.salary_type === 'monthly' ? `Oylik: ${fmt(emp.base_salary)} so'm` : `Soatbay: ${fmt(emp.base_salary)} so'm`}
          </div>
        </div>
      </div>

      {/* Statistika */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
        {[
          { label: 'Keldi', value: stats?.present_days || 0, color: 'text-green-600', bg: 'bg-green-50' },
          { label: 'Kelmadi', value: stats?.absent_days || 0, color: 'text-red-600', bg: 'bg-red-50' },
          { label: 'Yarim kun', value: stats?.half_days || 0, color: 'text-yellow-600', bg: 'bg-yellow-50' },
          { label: 'Ish soat', value: stats?.total_hours || 0, color: 'text-blue-600', bg: 'bg-blue-50' },
        ].map(s => (
          <div key={s.label} className={`card text-center ${s.bg}`}>
            <p className={`text-3xl font-bold ${s.color}`}>{s.value}</p>
            <p className="text-slate-500 text-sm mt-1">{s.label}</p>
          </div>
        ))}
      </div>

      {/* Grafik */}
      {chartData.length > 0 && (
        <div className="card">
          <h3 className="font-semibold text-slate-700 mb-4">Bu oygi ish soatlari</h3>
          <SimpleBar data={chartData} />
        </div>
      )}

      {/* Davomat jadvali */}
      <div className="card p-0 overflow-hidden">
        <div className="px-5 py-4 border-b border-slate-100">
          <h3 className="font-semibold text-slate-700">Bu oygi davomat</h3>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead className="bg-slate-50">
              <tr>
                <th className="text-left px-5 py-3 text-slate-500 font-medium">Sana</th>
                <th className="text-left px-5 py-3 text-slate-500 font-medium">Holat</th>
                <th className="text-left px-5 py-3 text-slate-500 font-medium">Keldi</th>
                <th className="text-left px-5 py-3 text-slate-500 font-medium">Ketdi</th>
                <th className="text-left px-5 py-3 text-slate-500 font-medium">Ish soat</th>
                <th className="text-left px-5 py-3 text-slate-500 font-medium">Kechikish</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-50">
              {attendance.length === 0 ? (
                <tr><td colSpan={6} className="text-center py-8 text-slate-400">Ma'lumot yo'q</td></tr>
              ) : attendance.map(a => (
                <tr key={a.id} className="hover:bg-slate-50">
                  <td className="px-5 py-3 text-slate-700">{a.date}</td>
                  <td className="px-5 py-3">
                    <span className={a.status === 'present' ? 'badge-present' : a.status === 'absent' ? 'badge-absent' : 'badge-half'}>
                      {a.status === 'present' ? 'Keldi' : a.status === 'absent' ? 'Kelmadi' : 'Yarim kun'}
                    </span>
                  </td>
                  <td className="px-5 py-3 text-slate-600">{a.check_in || '—'}</td>
                  <td className="px-5 py-3 text-slate-600">{a.check_out || '—'}</td>
                  <td className="px-5 py-3 text-slate-600">{a.work_hours || 0} soat</td>
                  <td className="px-5 py-3 text-slate-600">{a.late_minutes ? `${a.late_minutes} daq` : '—'}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
