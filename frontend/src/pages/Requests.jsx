import { useEffect, useState } from 'react';
import api from '../api';
import toast from 'react-hot-toast';

const getUser = () => { try { return JSON.parse(localStorage.getItem('user')); } catch { return null; } };

const TYPES = {
  leave: '🏖️ Ta\'tilga chiqish',
  sick: '🤒 Kasallik',
  permission: '🚪 Ruxsat (qisqa)',
  other: '📝 Boshqa'
};

const STATUS = {
  pending:  { label: 'Kutilmoqda', cls: 'bg-amber-100 text-amber-700' },
  approved: { label: '✓ Tasdiqlandi', cls: 'bg-green-100 text-green-700' },
  rejected: { label: '✗ Rad etildi', cls: 'bg-red-100 text-red-600' },
};

export default function Requests() {
  const user = getUser();
  const isAdmin = user?.role === 'admin';
  const [list, setList] = useState([]);
  const [filter, setFilter] = useState('');
  const [typeFilter, setTypeFilter] = useState('');
  const [showForm, setShowForm] = useState(false);
  const [form, setForm] = useState({ type: 'permission', title: '', description: '' });
  const [adminNote, setAdminNote] = useState({});

  const fetchRequests = async () => {
    try {
      const params = {};
      if (filter) params.status = filter;
      if (typeFilter) params.type = typeFilter;
      const res = await api.get('/requests', { params });
      setList(res.data);
      // So'rovlar sahifasi ochilganda request bildirishnomalarini o'qildi deb belgilash
      if (isAdmin) {
        await api.patch('/notifications/read-requests').catch(() => {});
      }
    } catch (err) {
      toast.error(err.response?.data?.error || 'So\'rovlarni yuklashda xatolik');
    }
  };

  useEffect(() => { fetchRequests(); }, [filter, typeFilter]);

  // Sahifa ochilganda Layout ga yangilash signali
  useEffect(() => {
    return () => {
      // Sahifadan chiqganda pending sonini yangilasin
      window.dispatchEvent(new Event('requests-read'));
    };
  }, []);

  const submit = async (e) => {
    e.preventDefault();
    try {
      await api.post('/requests', form);
      toast.success('So\'rov yuborildi! Admin tasdiqlashini kuting.');
      setShowForm(false);
      setForm({ type: 'permission', title: '', description: '' });
      fetchRequests();
    } catch (err) { toast.error(err.response?.data?.error || 'Xatolik'); }
  };

  const decide = async (id, status) => {
    try {
      await api.patch(`/requests/${id}`, { status, admin_note: adminNote[id] || '' });
      toast.success(status === 'approved' ? 'Tasdiqlandi' : 'Rad etildi');
      fetchRequests();
    } catch { toast.error('Xatolik'); }
  };

  const pending = list.filter(r => r.status === 'pending').length;

  return (
    <div className="p-6 space-y-5 max-w-4xl">
      <div className="flex items-center justify-between flex-wrap gap-3">
        <div>
          <h1 className="text-2xl font-bold text-slate-800">
            {isAdmin ? 'Xodim so\'rovlari' : 'Mening so\'rovlarim'}
          </h1>
          <p className="text-slate-500 text-sm">
            {isAdmin && pending > 0
              ? <span className="text-amber-600 font-medium">{pending} ta yangi so'rov kutilmoqda</span>
              : `${list.length} ta so'rov`}
          </p>
        </div>
        {!isAdmin && (
          <button onClick={() => setShowForm(!showForm)} className="btn-primary flex items-center gap-2">
            <svg xmlns="http://www.w3.org/2000/svg" className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
            </svg>
            Yangi so'rov
          </button>
        )}
      </div>

      {/* Yangi so'rov formasi (xodim uchun) */}
      {showForm && !isAdmin && (
        <div className="card border-2 border-indigo-100">
          <h3 className="font-semibold text-slate-700 mb-4">So'rov yuborish</h3>
          <form onSubmit={submit} className="space-y-4">
            <div>
              <label className="label">So'rov turi</label>
              <select className="input" value={form.type} onChange={e => setForm(f => ({ ...f, type: e.target.value }))}>
                {Object.entries(TYPES).map(([k, v]) => <option key={k} value={k}>{v}</option>)}
              </select>
            </div>
            <div>
              <label className="label">Batafsil izoh</label>
              <textarea className="input resize-none" rows={4}
                placeholder="Nima sababdan ruxsat so'rayapsiz..."
                value={form.description}
                onChange={e => setForm(f => ({ ...f, description: e.target.value }))}
                required />
            </div>
            <div className="flex gap-3">
              <button type="submit" className="btn-primary">Yuborish</button>
              <button type="button" onClick={() => setShowForm(false)} className="btn-secondary">Bekor</button>
            </div>
          </form>
        </div>
      )}

      {/* Status filterlari */}
      <div className="flex gap-2 flex-wrap">
        {[['', 'Barchasi'], ['pending', 'Kutilmoqda'], ['approved', 'Tasdiqlangan'], ['rejected', 'Rad etilgan']].map(([v, l]) => (
          <button key={v} onClick={() => setFilter(v)}
            className={`px-3 py-1.5 rounded-lg text-sm font-medium transition-colors ${filter === v ? 'bg-indigo-600 text-white' : 'bg-white text-slate-600 border border-slate-200 hover:bg-slate-50'}`}>
            {l}
          </button>
        ))}
      </div>

      {/* Tur filterlari */}
      <div className="flex gap-2 flex-wrap">
        <span className="text-xs text-slate-400 self-center">Tur:</span>
        {[['', 'Hammasi'], ['leave', "Ta'til"], ['sick', 'Kasallik'], ['permission', 'Ruxsat'], ['other', 'Boshqa']].map(([v, l]) => (
          <button key={v} onClick={() => setTypeFilter(v)}
            className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-colors ${typeFilter === v ? 'bg-purple-600 text-white' : 'bg-white text-slate-600 border border-slate-200 hover:bg-slate-50'}`}>
            {l}
          </button>
        ))}
      </div>

      {/* So'rovlar ro'yxati */}
      <div className="space-y-3">
        {list.length === 0 ? (
          <div className="card text-center py-12">
            <svg xmlns="http://www.w3.org/2000/svg" className="w-12 h-12 text-slate-300 mx-auto mb-3" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
            </svg>
            <p className="text-slate-400">So'rovlar yo'q</p>
          </div>
        ) : list.map(r => (
          <div key={r.id} className={`card border-l-4 ${r.status === 'approved' ? 'border-green-400' : r.status === 'rejected' ? 'border-red-400' : 'border-amber-400'}`}>
            <div className="flex items-start justify-between gap-4 flex-wrap">
              <div className="flex-1">
                <div className="flex items-center gap-2 flex-wrap mb-1">
                  <span className="text-sm text-slate-500">{TYPES[r.type] || r.type}</span>
                  <span className={`px-2 py-0.5 rounded-full text-xs font-medium ${STATUS[r.status]?.cls}`}>
                    {STATUS[r.status]?.label}
                  </span>
                </div>
                {isAdmin && (
                  <p className="font-semibold text-indigo-600 text-sm mb-1">
                    {r.last_name} {r.first_name} — {r.position}
                  </p>
                )}
                <h3 className="font-semibold text-slate-800">{r.title}</h3>
                {r.description && <p className="text-slate-500 text-sm mt-1">{r.description}</p>}
                <div className="flex gap-4 mt-2 text-xs text-slate-400">
                  {r.start_date && <span>📅 {r.start_date.replace('T', ' ')}</span>}
                  {r.end_date && <span>→ {r.end_date.replace('T', ' ')}</span>}
                  <span>Yuborilgan: {new Date(r.created_at).toLocaleString('uz-UZ')}</span>
                </div>
                {r.admin_note && (
                  <div className="mt-2 bg-slate-50 rounded-lg px-3 py-2 text-sm text-slate-600">
                    <span className="font-medium">Admin izohi:</span> {r.admin_note}
                  </div>
                )}
              </div>

              {/* Admin tugmalari */}
              {isAdmin && r.status === 'pending' && (
                <div className="flex flex-col gap-2 min-w-48">
                  <input className="input text-sm" placeholder="Izoh (ixtiyoriy)"
                    value={adminNote[r.id] || ''}
                    onChange={e => setAdminNote(n => ({ ...n, [r.id]: e.target.value }))} />
                  <div className="flex gap-2">
                    <button onClick={() => decide(r.id, 'approved')}
                      className="flex-1 bg-green-500 hover:bg-green-600 text-white py-2 rounded-lg text-sm font-medium transition-colors flex items-center justify-center gap-1">
                      <svg xmlns="http://www.w3.org/2000/svg" className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M5 13l4 4L19 7" />
                      </svg>
                      Tasdiqlash
                    </button>
                    <button onClick={() => decide(r.id, 'rejected')}
                      className="flex-1 bg-red-500 hover:bg-red-600 text-white py-2 rounded-lg text-sm font-medium transition-colors flex items-center justify-center gap-1">
                      <svg xmlns="http://www.w3.org/2000/svg" className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                      </svg>
                      Rad etish
                    </button>
                  </div>
                </div>
              )}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
