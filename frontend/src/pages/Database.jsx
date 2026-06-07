import { useEffect, useState } from 'react';
import api from '../api';
import toast from 'react-hot-toast';

const TABLES = {
  employees:     { label: 'Ishchilar', icon: '👥', color: 'bg-blue-50 text-blue-700 border-blue-100' },
  attendance:    { label: 'Davomat',   icon: '📅', color: 'bg-green-50 text-green-700 border-green-100' },
  salary:        { label: 'Maosh',     icon: '💰', color: 'bg-purple-50 text-purple-700 border-purple-100' },
  vacations:     { label: "Ta'til",    icon: '🏖️', color: 'bg-amber-50 text-amber-700 border-amber-100' },
  requests:      { label: "So'rovlar", icon: '📝', color: 'bg-rose-50 text-rose-700 border-rose-100' },
  notifications: { label: 'Bildirishnomalar', icon: '🔔', color: 'bg-slate-50 text-slate-700 border-slate-100' },
};

export default function Database() {
  const [stats, setStats] = useState(null);
  const [activeTable, setActiveTable] = useState('employees');
  const [rows, setRows] = useState([]);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(0);
  const [search, setSearch] = useState('');
  const [loading, setLoading] = useState(false);
  const [sqlMode, setSqlMode] = useState(false);
  const [sql, setSql] = useState('SELECT * FROM employees LIMIT 10');
  const [sqlResult, setSqlResult] = useState(null);
  const LIMIT = 20;

  useEffect(() => {
    api.get('/db/stats').then(r => setStats(r.data)).catch(() => {});
  }, []);

  useEffect(() => {
    fetchTable();
  }, [activeTable, page, search]);

  const fetchTable = async () => {
    setLoading(true);
    try {
      const res = await api.get(`/db/table/${activeTable}`, {
        params: { limit: LIMIT, offset: page * LIMIT, search }
      });
      setRows(res.data.rows);
      setTotal(res.data.total);
    } catch (err) {
      toast.error('Xatolik');
    } finally { setLoading(false); }
  };

  const runSql = async () => {
    try {
      const res = await api.post('/db/query', { sql });
      setSqlResult(res.data);
      toast.success(`${res.data.count} ta natija`);
    } catch (err) {
      toast.error(err.response?.data?.error || 'SQL xatosi');
      setSqlResult(null);
    }
  };

  const deleteRow = async (id) => {
    if (!confirm(`ID=${id} ni o'chirishni tasdiqlaysizmi?`)) return;
    try {
      await api.delete(`/db/table/${activeTable}/${id}`);
      toast.success("O'chirildi");
      fetchTable();
    } catch (err) { toast.error(err.response?.data?.error || 'Xatolik'); }
  };

  const backup = () => {
    window.open('/api/db/backup', '_blank');
    toast.success('Backup yuklanmoqda...');
  };

  const exportJson = (table) => {
    window.open(`/api/db/export/${table}`, '_blank');
  };

  const cols = rows.length > 0 ? Object.keys(rows[0]) : [];
  const totalPages = Math.ceil(total / LIMIT);

  return (
    <div className="p-6 space-y-5">
      <div className="flex items-center justify-between flex-wrap gap-3">
        <div>
          <h1 className="text-2xl font-bold text-slate-800">Database</h1>
          <p className="text-slate-500 text-sm">Ma'lumotlar bazasini boshqarish</p>
        </div>
        <div className="flex gap-2">
          <button onClick={backup}
            className="btn-primary flex items-center gap-2">
            <svg xmlns="http://www.w3.org/2000/svg" className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M9 19l3 3m0 0l3-3m-3 3V10" />
            </svg>
            Backup (.db)
          </button>
          <button onClick={() => setSqlMode(!sqlMode)}
            className={`flex items-center gap-2 px-4 py-2 rounded-lg font-medium transition-colors ${sqlMode ? 'bg-indigo-600 text-white' : 'btn-secondary'}`}>
            <svg xmlns="http://www.w3.org/2000/svg" className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 20l4-16m4 4l4 4-4 4M6 16l-4-4 4-4" />
            </svg>
            SQL
          </button>
        </div>
      </div>

      {/* Statistika kartochkalari */}
      {stats && (
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3">
          {Object.entries(TABLES).map(([key, val]) => (
            <button key={key} onClick={() => { setActiveTable(key); setPage(0); setSqlMode(false); }}
              className={`rounded-xl border p-3 text-left transition-all hover:shadow-md ${val.color} ${activeTable === key ? 'ring-2 ring-indigo-400 shadow-md' : ''}`}>
              <div className="text-2xl mb-1">{val.icon}</div>
              <div className="text-lg font-bold">{stats.tables[key] || 0}</div>
              <div className="text-xs opacity-70">{val.label}</div>
            </button>
          ))}
        </div>
      )}

      {/* DB hajmi */}
      {stats && (
        <div className="card flex items-center justify-between flex-wrap gap-3">
          <div className="flex items-center gap-3">
            <div className="bg-slate-100 p-2.5 rounded-xl">
              <svg xmlns="http://www.w3.org/2000/svg" className="w-5 h-5 text-slate-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 7v10c0 2.21 3.582 4 8 4s8-1.79 8-4V7M4 7c0 2.21 3.582 4 8 4s8-1.79 8-4M4 7c0-2.21 3.582-4 8-4s8 1.79 8 4" />
              </svg>
            </div>
            <div>
              <p className="font-semibold text-slate-700">ishxona.db</p>
              <p className="text-slate-400 text-sm">SQLite • {stats.db_size_mb} MB</p>
            </div>
          </div>
          <div className="flex gap-2 flex-wrap">
            {Object.keys(TABLES).filter(t => !['notifications'].includes(t)).map(t => (
              <button key={t} onClick={() => exportJson(t)}
                className="text-xs px-3 py-1.5 bg-slate-100 hover:bg-slate-200 text-slate-600 rounded-lg transition-colors flex items-center gap-1">
                <svg xmlns="http://www.w3.org/2000/svg" className="w-3 h-3" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" />
                </svg>
                {TABLES[t].label} JSON
              </button>
            ))}
          </div>
        </div>
      )}

      {/* SQL rejimi */}
      {sqlMode && (
        <div className="card space-y-3">
          <div className="flex items-center justify-between">
            <h3 className="font-semibold text-slate-700 flex items-center gap-2">
              <svg xmlns="http://www.w3.org/2000/svg" className="w-4 h-4 text-indigo-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 20l4-16m4 4l4 4-4 4M6 16l-4-4 4-4" />
              </svg>
              SQL So'rov (faqat SELECT)
            </h3>
          </div>
          <textarea
            className="input font-mono text-sm resize-none"
            rows={4}
            value={sql}
            onChange={e => setSql(e.target.value)}
            placeholder="SELECT * FROM employees WHERE status='active' LIMIT 10"
          />
          <button onClick={runSql} className="btn-primary">Bajarish</button>

          {sqlResult && (
            <div className="overflow-x-auto rounded-xl border border-slate-100 mt-2">
              <p className="px-4 py-2 text-xs text-slate-400 bg-slate-50 border-b">{sqlResult.count} ta natija</p>
              {sqlResult.rows.length > 0 && (
                <table className="w-full text-xs">
                  <thead className="bg-slate-50">
                    <tr>{Object.keys(sqlResult.rows[0]).map(c => (
                      <th key={c} className="text-left px-3 py-2 text-slate-500 font-medium">{c}</th>
                    ))}</tr>
                  </thead>
                  <tbody className="divide-y divide-slate-50">
                    {sqlResult.rows.map((row, i) => (
                      <tr key={i} className="hover:bg-slate-50">
                        {Object.values(row).map((v, j) => (
                          <td key={j} className="px-3 py-2 text-slate-600 max-w-xs truncate">
                            {v === null ? <span className="text-slate-300">null</span> : String(v)}
                          </td>
                        ))}
                      </tr>
                    ))}
                  </tbody>
                </table>
              )}
            </div>
          )}
        </div>
      )}

      {/* Jadval ko'rish */}
      {!sqlMode && (
        <div className="card p-0 overflow-hidden">
          <div className="px-5 py-4 border-b border-slate-100 flex items-center justify-between flex-wrap gap-3">
            <div className="flex items-center gap-2">
              <span className="text-lg">{TABLES[activeTable]?.icon}</span>
              <h3 className="font-semibold text-slate-700">{TABLES[activeTable]?.label}</h3>
              <span className="text-xs text-slate-400">({total} ta yozuv)</span>
            </div>
            <div className="flex items-center gap-2">
              {activeTable === 'employees' && (
                <input className="input text-sm w-44" placeholder="Qidirish..."
                  value={search} onChange={e => { setSearch(e.target.value); setPage(0); }} />
              )}
            </div>
          </div>

          {loading ? (
            <div className="flex justify-center py-12">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-indigo-500"></div>
            </div>
          ) : rows.length === 0 ? (
            <p className="text-center py-12 text-slate-400">Ma'lumot yo'q</p>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-xs">
                <thead className="bg-slate-50 border-b">
                  <tr>
                    {cols.map(c => (
                      <th key={c} className="text-left px-3 py-2.5 text-slate-500 font-medium whitespace-nowrap">{c}</th>
                    ))}
                    <th className="px-3 py-2.5 text-slate-500 font-medium">Amal</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-50">
                  {rows.map((row, i) => (
                    <tr key={i} className="hover:bg-slate-50">
                      {cols.map(c => (
                        <td key={c} className="px-3 py-2 text-slate-600 max-w-xs">
                          <span className="truncate block max-w-32" title={String(row[c] ?? '')}>
                            {row[c] === null
                              ? <span className="text-slate-300">—</span>
                              : c === 'password' || c === 'password_hash'
                              ? <span className="text-slate-300">••••••</span>
                              : String(row[c]).length > 30
                              ? String(row[c]).slice(0, 30) + '...'
                              : String(row[c])}
                          </span>
                        </td>
                      ))}
                      <td className="px-3 py-2">
                        {!['employees'].includes(activeTable) && (
                          <button onClick={() => deleteRow(row.id)}
                            className="p-1 text-slate-400 hover:text-red-500 hover:bg-red-50 rounded transition-colors">
                            <svg xmlns="http://www.w3.org/2000/svg" className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                            </svg>
                          </button>
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}

          {/* Pagination */}
          {totalPages > 1 && (
            <div className="px-5 py-3 border-t border-slate-100 flex items-center justify-between">
              <span className="text-xs text-slate-400">{page * LIMIT + 1}–{Math.min((page + 1) * LIMIT, total)} / {total}</span>
              <div className="flex gap-1">
                <button onClick={() => setPage(p => Math.max(0, p - 1))} disabled={page === 0}
                  className="px-3 py-1 text-xs rounded-lg border border-slate-200 disabled:opacity-40 hover:bg-slate-50 transition-colors">← Oldingi</button>
                <button onClick={() => setPage(p => Math.min(totalPages - 1, p + 1))} disabled={page >= totalPages - 1}
                  className="px-3 py-1 text-xs rounded-lg border border-slate-200 disabled:opacity-40 hover:bg-slate-50 transition-colors">Keyingi →</button>
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
