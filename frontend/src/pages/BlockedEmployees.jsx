import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import api from '../api';
import toast from 'react-hot-toast';

export default function BlockedEmployees() {
  const [list, setList] = useState([]);
  const [loading, setLoading] = useState(true);

  const fetch = async () => {
    setLoading(true);
    try {
      const res = await api.get('/employees', { params: { status: 'blocked' } });
      setList(res.data);
    } finally { setLoading(false); }
  };

  useEffect(() => { fetch(); }, []);

  const unblock = async (id, name) => {
    if (!confirm(`"${name}" ni blokdan chiqarishni tasdiqlaysizmi?`)) return;
    try {
      await api.put(`/employees/${id}`, { ...await api.get(`/employees/${id}`).then(r => r.data), status: 'active' });
      toast.success('Blokdan chiqarildi');
      fetch();
    } catch { toast.error('Xatolik'); }
  };

  const deleteEmp = async (id, name) => {
    if (!confirm(`"${name}" ni BUTUNLAY o'chirishni tasdiqlaysizmi? Bu amalni qaytarib bo'lmaydi!`)) return;
    try {
      await api.delete(`/employees/${id}`);
      toast.success("O'chirildi");
      fetch();
    } catch { toast.error('Xatolik'); }
  };

  return (
    <div className="p-6 space-y-5">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-slate-800 dark:text-white">Bloklangan ishchilar</h1>
          <p className="text-slate-500 text-sm">{list.length} ta bloklangan</p>
        </div>
        <Link to="/app/employees" className="btn-secondary">← Ishchilar</Link>
      </div>

      {loading ? (
        <div className="flex justify-center py-12">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-red-500"></div>
        </div>
      ) : list.length === 0 ? (
        <div className="card text-center py-16">
          <div className="text-5xl mb-3">🔓</div>
          <p className="text-slate-500">Bloklangan ishchilar yo'q</p>
        </div>
      ) : (
        <div className="card p-0 overflow-hidden">
          <table className="w-full text-sm">
            <thead className="bg-red-50 border-b border-red-100">
              <tr>
                <th className="text-left px-5 py-3 text-slate-600 font-medium">Ishchi</th>
                <th className="text-left px-5 py-3 text-slate-600 font-medium">Lavozim</th>
                <th className="text-left px-5 py-3 text-slate-600 font-medium">Bo'lim</th>
                <th className="text-left px-5 py-3 text-slate-600 font-medium">Telefon</th>
                <th className="text-right px-5 py-3 text-slate-600 font-medium">Amallar</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-50">
              {list.map(emp => (
                <tr key={emp.id} className="hover:bg-red-50/30">
                  <td className="px-5 py-3">
                    <div className="flex items-center gap-3">
                      <div className="w-9 h-9 rounded-full bg-red-100 flex items-center justify-center font-bold text-red-500 text-sm">
                        {emp.first_name?.[0]}{emp.last_name?.[0]}
                      </div>
                      <div>
                        <p className="font-medium text-slate-800">{emp.last_name} {emp.first_name}</p>
                        <p className="text-xs text-red-400">🔒 Bloklangan</p>
                      </div>
                    </div>
                  </td>
                  <td className="px-5 py-3 text-slate-600">{emp.position || '—'}</td>
                  <td className="px-5 py-3 text-slate-600">{emp.department || '—'}</td>
                  <td className="px-5 py-3 text-slate-600">{emp.phone || '—'}</td>
                  <td className="px-5 py-3">
                    <div className="flex items-center justify-end gap-2">
                      <button onClick={() => unblock(emp.id, `${emp.first_name} ${emp.last_name}`)}
                        className="px-3 py-1.5 bg-green-100 hover:bg-green-200 text-green-700 rounded-lg text-xs font-medium transition-colors flex items-center gap-1">
                        🔓 Blokdan chiqarish
                      </button>
                      <button onClick={() => deleteEmp(emp.id, `${emp.first_name} ${emp.last_name}`)}
                        className="px-3 py-1.5 bg-red-100 hover:bg-red-200 text-red-600 rounded-lg text-xs font-medium transition-colors flex items-center gap-1">
                        🗑️ O'chirish
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
