import { useEffect, useState } from 'react';
import api from '../api';
import toast from 'react-hot-toast';

const getUser = () => { try { return JSON.parse(localStorage.getItem('user')); } catch { return null; } };
const fmt = t => new Date(t).toLocaleString('uz-UZ');

export default function Messages() {
  const user = getUser();
  const isAdmin = user?.role === 'admin';
  const [tab, setTab] = useState('messages');
  const [messages, setMessages] = useState([]);
  const [announcements, setAnnouncements] = useState([]);
  const [employees, setEmployees] = useState([]);
  const [msgForm, setMsgForm] = useState({ to_id: '', message: '' });
  const [annForm, setAnnForm] = useState({ title: '', body: '', priority: 'normal' });
  const [showMsgForm, setShowMsgForm] = useState(false);
  const [showAnnForm, setShowAnnForm] = useState(false);

  useEffect(() => {
    fetchAll();
    if (isAdmin) api.get('/employees').then(r => setEmployees(r.data)).catch(() => {});
  }, []);

  const fetchAll = () => {
    api.get('/messages').then(r => setMessages(r.data)).catch(() => {});
    api.get('/messages/announcements').then(r => setAnnouncements(r.data)).catch(() => {});
  };

  const sendMsg = async (e) => {
    e.preventDefault();
    try {
      await api.post('/messages', msgForm);
      toast.success('Xabar yuborildi');
      setMsgForm({ to_id: '', message: '' });
      setShowMsgForm(false);
      fetchAll();
    } catch (err) { toast.error(err.response?.data?.error || 'Xatolik'); }
  };

  const postAnn = async (e) => {
    e.preventDefault();
    try {
      await api.post('/messages/announcements', annForm);
      toast.success('E\'lon joylashtirildi');
      setAnnForm({ title: '', body: '', priority: 'normal' });
      setShowAnnForm(false);
      fetchAll();
    } catch (err) { toast.error(err.response?.data?.error || 'Xatolik'); }
  };

  const delMsg = async (id) => {
    await api.delete(`/messages/${id}`);
    fetchAll();
  };

  const delAnn = async (id) => {
    await api.delete(`/messages/announcements/${id}`);
    fetchAll();
  };

  const markRead = async (id) => {
    await api.patch(`/messages/${id}/read`);
    fetchAll();
  };

  const PRIORITY = {
    normal: { label: 'Oddiy', cls: 'bg-slate-100 text-slate-600' },
    important: { label: '❗ Muhim', cls: 'bg-amber-100 text-amber-700' },
    urgent: { label: '🚨 Shoshilinch', cls: 'bg-red-100 text-red-600' },
  };

  return (
    <div className="p-6 space-y-5 max-w-3xl">
      <div className="flex items-center justify-between flex-wrap gap-3">
        <div>
          <h1 className="text-2xl font-bold text-slate-800 dark:text-white">Xabarlar va E'lonlar</h1>
        </div>
        <div className="flex gap-2">
          <button onClick={() => { setShowMsgForm(!showMsgForm); setShowAnnForm(false); }}
            className="btn-primary text-sm">💬 Xabar yuborish</button>
          {isAdmin && (
            <button onClick={() => { setShowAnnForm(!showAnnForm); setShowMsgForm(false); }}
              className="btn-secondary text-sm">📢 E'lon qo'shish</button>
          )}
        </div>
      </div>

      {/* Xabar yuborish formasi */}
      {showMsgForm && (
        <form onSubmit={sendMsg} className="card border-2 border-indigo-100 space-y-3">
          <h3 className="font-semibold text-slate-700 dark:text-white">💬 Xabar yuborish</h3>
          {isAdmin && (
            <div>
              <label className="label">Kimga</label>
              <select className="input" value={msgForm.to_id} onChange={e => setMsgForm(f => ({...f, to_id: e.target.value}))}>
                <option value="">Barcha xodimlar</option>
                {employees.map(e => <option key={e.id} value={e.id}>{e.last_name} {e.first_name}</option>)}
              </select>
            </div>
          )}
          <div>
            <label className="label">Xabar</label>
            <textarea className="input resize-none" rows={3} placeholder="Xabaringizni yozing..."
              value={msgForm.message} onChange={e => setMsgForm(f => ({...f, message: e.target.value}))} required />
          </div>
          <div className="flex gap-2">
            <button type="submit" className="btn-primary text-sm">Yuborish</button>
            <button type="button" onClick={() => setShowMsgForm(false)} className="btn-secondary text-sm">Bekor</button>
          </div>
        </form>
      )}

      {/* E'lon qo'shish formasi */}
      {showAnnForm && isAdmin && (
        <form onSubmit={postAnn} className="card border-2 border-amber-100 space-y-3">
          <h3 className="font-semibold text-slate-700 dark:text-white">📢 Yangi e'lon</h3>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className="label">Sarlavha</label>
              <input className="input" placeholder="E'lon sarlavhasi" value={annForm.title}
                onChange={e => setAnnForm(f => ({...f, title: e.target.value}))} required />
            </div>
            <div>
              <label className="label">Muhimlik darajasi</label>
              <select className="input" value={annForm.priority} onChange={e => setAnnForm(f => ({...f, priority: e.target.value}))}>
                <option value="normal">Oddiy</option>
                <option value="important">❗ Muhim</option>
                <option value="urgent">🚨 Shoshilinch</option>
              </select>
            </div>
            <div className="sm:col-span-2">
              <label className="label">Matn</label>
              <textarea className="input resize-none" rows={4} placeholder="E'lon matni..."
                value={annForm.body} onChange={e => setAnnForm(f => ({...f, body: e.target.value}))} required />
            </div>
          </div>
          <div className="flex gap-2">
            <button type="submit" className="btn-primary text-sm">E'lon qilish</button>
            <button type="button" onClick={() => setShowAnnForm(false)} className="btn-secondary text-sm">Bekor</button>
          </div>
        </form>
      )}

      {/* Tablar */}
      <div className="flex gap-1 bg-slate-100 dark:bg-slate-800 rounded-xl p-1">
        <button onClick={() => setTab('messages')}
          className={`flex-1 py-2 rounded-lg text-sm font-medium transition-colors ${tab==='messages'?'bg-white dark:bg-slate-700 shadow text-indigo-600':'text-slate-500'}`}>
          💬 Xabarlar ({messages.filter(m => !m.is_read).length > 0 ? `${messages.filter(m => !m.is_read).length} yangi` : messages.length})
        </button>
        <button onClick={() => setTab('announcements')}
          className={`flex-1 py-2 rounded-lg text-sm font-medium transition-colors ${tab==='announcements'?'bg-white dark:bg-slate-700 shadow text-indigo-600':'text-slate-500'}`}>
          📢 E'lonlar ({announcements.length})
        </button>
      </div>

      {/* Xabarlar */}
      {tab === 'messages' && (
        <div className="space-y-3">
          {messages.length === 0 ? (
            <div className="card text-center py-10 text-slate-400">
              <div className="text-4xl mb-2">💬</div>
              <p>Xabarlar yo'q</p>
            </div>
          ) : messages.map(m => (
            <div key={m.id} onClick={() => !m.is_read && markRead(m.id)}
              className={`card py-3 cursor-pointer transition-all ${!m.is_read ? 'border-l-4 border-indigo-500 bg-indigo-50/50 dark:bg-indigo-900/10' : ''}`}>
              <div className="flex items-start justify-between gap-3">
                <div className="flex-1">
                  <div className="flex items-center gap-2 mb-1">
                    <span className="font-semibold text-sm text-slate-700 dark:text-slate-200">
                      {m.from_name || `${m.last_name || ''} ${m.first_name || ''}`.trim() || 'Noma\'lum'}
                    </span>
                    {!m.is_read && <span className="w-2 h-2 bg-indigo-500 rounded-full flex-shrink-0"></span>}
                  </div>
                  <p className="text-slate-600 dark:text-slate-300 text-sm">{m.message}</p>
                  <p className="text-xs text-slate-400 mt-1">{fmt(m.created_at)}</p>
                </div>
                {isAdmin && (
                  <button onClick={e => { e.stopPropagation(); delMsg(m.id); }}
                    className="text-slate-400 hover:text-red-500 p-1 rounded transition-colors flex-shrink-0">
                    <svg xmlns="http://www.w3.org/2000/svg" className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                    </svg>
                  </button>
                )}
              </div>
            </div>
          ))}
        </div>
      )}

      {/* E'lonlar */}
      {tab === 'announcements' && (
        <div className="space-y-3">
          {announcements.length === 0 ? (
            <div className="card text-center py-10 text-slate-400">
              <div className="text-4xl mb-2">📢</div>
              <p>E'lonlar yo'q</p>
            </div>
          ) : announcements.map(a => (
            <div key={a.id} className={`card border-l-4 ${a.priority === 'urgent' ? 'border-red-400' : a.priority === 'important' ? 'border-amber-400' : 'border-slate-200'}`}>
              <div className="flex items-start justify-between gap-3">
                <div className="flex-1">
                  <div className="flex items-center gap-2 mb-2">
                    <span className={`px-2 py-0.5 rounded-full text-xs font-medium ${PRIORITY[a.priority]?.cls}`}>
                      {PRIORITY[a.priority]?.label}
                    </span>
                    <span className="text-xs text-slate-400">{a.author}</span>
                  </div>
                  <h3 className="font-semibold text-slate-800 dark:text-white mb-1">{a.title}</h3>
                  <p className="text-slate-600 dark:text-slate-300 text-sm whitespace-pre-wrap">{a.body}</p>
                  <p className="text-xs text-slate-400 mt-2">{fmt(a.created_at)}</p>
                </div>
                {isAdmin && (
                  <button onClick={() => delAnn(a.id)}
                    className="text-slate-400 hover:text-red-500 p-1 rounded transition-colors flex-shrink-0">
                    <svg xmlns="http://www.w3.org/2000/svg" className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                    </svg>
                  </button>
                )}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
