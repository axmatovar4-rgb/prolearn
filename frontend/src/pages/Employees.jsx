import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import api from '../api';
import toast from 'react-hot-toast';
import { useApp } from '../context/AppContext';

export default function Employees() {
  const [employees, setEmployees] = useState([]);
  const [search, setSearch] = useState('');
  const [dept, setDept] = useState('');
  const [departments, setDepartments] = useState([]);
  const [loading, setLoading] = useState(true);
  const { t } = useApp();

  const fetchData = async () => {
    setLoading(true);
    try {
      const params = { status: 'active' };
      if (search) params.search = search;
      if (dept) params.department = dept;
      const res = await api.get('/employees', { params });
      setEmployees(res.data);
    } catch {
      toast.error('Xatolik yuz berdi');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    api.get('/employees/meta/departments').then(r => setDepartments(r.data));
  }, []);

  useEffect(() => {
    const ti = setTimeout(fetchData, 300);
    return () => clearTimeout(ti);
  }, [search, dept]);

  const deleteEmployee = async (id, name) => {
    if (!confirm(`"${name}" ni o'chirishni tasdiqlaysizmi?`)) return;
    try {
      await api.delete(`/employees/${id}`);
      toast.success("O'chirildi");
      fetchData();
    } catch { toast.error('Xatolik'); }
  };

  const blockEmployee = async (id, name) => {
    if (!confirm(`"${name}" ni bloklashni tasdiqlaysizmi?`)) return;
    try {
      await api.patch(`/employees/${id}/block`);
      toast.success('Bloklandi');
      fetchData();
    } catch { toast.error('Xatolik'); }
  };

  return (
    <div className="p-6 space-y-5">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-slate-800 dark:text-white">{t('employees')}</h1>
          <p className="text-slate-500 dark:text-slate-400 text-sm">{employees.length} ta ishchi</p>
        </div>
        <div className="flex gap-2">
          <Link to="/app/blocked" className="btn-secondary flex items-center gap-2 text-red-500">
            🔒 Bloklangan
          </Link>
          <Link to="/app/employees/new" className="btn-primary flex items-center gap-2">
            <svg xmlns="http://www.w3.org/2000/svg" className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" /></svg>
            {t('new_employee')}
          </Link>
        </div>
      </div>

      <div className="card flex gap-3 flex-wrap">
        <div className="relative flex-1 min-w-48">
          <svg xmlns="http://www.w3.org/2000/svg" className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" /></svg>
          <input className="input pl-9" placeholder={t('search_placeholder')} value={search} onChange={e => setSearch(e.target.value)} />
        </div>
        <select className="input w-auto min-w-40" value={dept} onChange={e => setDept(e.target.value)}>
          <option value="">{t('all_departments')}</option>
          {departments.map(d => <option key={d} value={d}>{d}</option>)}
        </select>
      </div>

      {/* Table */}
      <div className="card p-0 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead className="bg-slate-50 dark:bg-slate-700 border-b border-slate-100 dark:border-slate-600">
              <tr>
                <th className="text-left px-5 py-3 text-slate-600 dark:text-slate-300 font-medium">{t('name')}</th>
                <th className="text-left px-5 py-3 text-slate-600 dark:text-slate-300 font-medium">{t('position')}</th>
                <th className="text-left px-5 py-3 text-slate-600 dark:text-slate-300 font-medium">{t('department')}</th>
                <th className="text-left px-5 py-3 text-slate-600 dark:text-slate-300 font-medium">{t('phone')}</th>
                <th className="text-left px-5 py-3 text-slate-600 dark:text-slate-300 font-medium">{t('status')}</th>
                <th className="text-right px-5 py-3 text-slate-600 dark:text-slate-300 font-medium">{t('actions')}</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-50">
              {loading ? (
                <tr><td colSpan={6} className="text-center py-12 text-slate-400">{t('loading')}</td></tr>
              ) : employees.length === 0 ? (
                <tr><td colSpan={6} className="text-center py-12 text-slate-400">{t('not_found')}</td></tr>
              ) : employees.map(emp => (
                <tr key={emp.id} className="hover:bg-slate-50 dark:hover:bg-slate-700 transition-colors">
                  <td className="px-5 py-3">
                    <div className="flex items-center gap-3">
                      {emp.photo ? (
                        <img src={emp.photo} alt="" className="w-9 h-9 rounded-full object-cover" />
                      ) : (
                        <div className="w-9 h-9 rounded-full bg-indigo-100 dark:bg-indigo-900 flex items-center justify-center font-bold text-indigo-600 dark:text-indigo-300 text-sm">
                          {emp.first_name?.[0]}{emp.last_name?.[0]}
                        </div>
                      )}
                      <div>
                        <p className="font-medium text-slate-800 dark:text-white">{emp.last_name} {emp.first_name}</p>
                        {emp.middle_name && <p className="text-slate-400 text-xs">{emp.middle_name}</p>}
                      </div>
                    </div>
                  </td>
                  <td className="px-5 py-3 text-slate-600 dark:text-slate-300">{emp.position || '—'}</td>
                  <td className="px-5 py-3 text-slate-600 dark:text-slate-300">{emp.department || '—'}</td>
                  <td className="px-5 py-3 text-slate-600 dark:text-slate-300">{emp.phone || '—'}</td>
                  <td className="px-5 py-3">
                    <span className={`px-2 py-0.5 rounded-full text-xs font-medium ${emp.status === 'active' ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'}`}>
                      {emp.status === 'active' ? t('active') : t('inactive')}
                    </span>
                  </td>
                  <td className="px-5 py-3">
                    <div className="flex items-center justify-end gap-1">
                      <Link to={`/app/employees/${emp.id}`} className="p-1.5 text-slate-400 hover:text-indigo-600 hover:bg-indigo-50 rounded-lg transition-colors">
                        <svg xmlns="http://www.w3.org/2000/svg" className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" /><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" /></svg>
                      </Link>
                      <Link to={`/app/employees/${emp.id}/edit`} className="p-1.5 text-slate-400 hover:text-green-600 hover:bg-green-50 rounded-lg transition-colors">
                        <svg xmlns="http://www.w3.org/2000/svg" className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" /></svg>
                      </Link>
                  <button onClick={() => blockEmployee(emp.id, `${emp.first_name} ${emp.last_name}`)} className="p-1.5 text-slate-400 hover:text-orange-600 hover:bg-orange-50 rounded-lg transition-colors" title="Bloklash">
                        <svg xmlns="http://www.w3.org/2000/svg" className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M18.364 18.364A9 9 0 005.636 5.636m12.728 12.728A9 9 0 015.636 5.636m12.728 12.728L5.636 5.636" /></svg>
                      </button>
                  <button onClick={() => deleteEmployee(emp.id, `${emp.first_name} ${emp.last_name}`)} className="p-1.5 text-slate-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors">
                        <svg xmlns="http://www.w3.org/2000/svg" className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" /></svg>
                      </button>
                    </div>
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
