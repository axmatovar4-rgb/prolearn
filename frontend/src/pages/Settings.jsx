import { useState } from 'react';
import api from '../api';
import toast from 'react-hot-toast';

export default function Settings() {
  const [form, setForm] = useState({ old_password: '', new_password: '', confirm: '' });
  const [loading, setLoading] = useState(false);
  const [show, setShow] = useState({ old: false, new: false, confirm: false });

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (form.new_password !== form.confirm) { toast.error('Yangi parollar mos emas'); return; }
    if (form.new_password.length < 4) { toast.error('Parol kamida 4 ta belgi bo\'lishi kerak'); return; }
    setLoading(true);
    try {
      await api.post('/auth/change-password', { old_password: form.old_password, new_password: form.new_password });
      toast.success('Parol o\'zgartirildi');
      setForm({ old_password: '', new_password: '', confirm: '' });
    } catch (err) {
      toast.error(err.response?.data?.error || 'Xatolik');
    } finally { setLoading(false); }
  };

  const EyeIcon = ({ open }) => (
    <svg xmlns="http://www.w3.org/2000/svg" className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
      {open
        ? <><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" /><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" /></>
        : <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13.875 18.825A10.05 10.05 0 0112 19c-4.478 0-8.268-2.943-9.543-7a9.97 9.97 0 011.563-3.029m5.858.908a3 3 0 114.243 4.243M9.878 9.878l4.242 4.242M9.88 9.88l-3.29-3.29m7.532 7.532l3.29 3.29M3 3l3.59 3.59m0 0A9.953 9.953 0 0112 5c4.478 0 8.268 2.943 9.543 7a10.025 10.025 0 01-4.132 5.411m0 0L21 21" />
      }
    </svg>
  );

  return (
    <div className="p-6 max-w-lg space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-slate-800">Sozlamalar</h1>
        <p className="text-slate-500 text-sm">Hisob sozlamalari</p>
      </div>

      <div className="card">
        <h2 className="font-semibold text-slate-700 mb-4 flex items-center gap-2">
          <svg xmlns="http://www.w3.org/2000/svg" className="w-5 h-5 text-indigo-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
          </svg>
          Parolni o'zgartirish
        </h2>
        <form onSubmit={handleSubmit} className="space-y-4">
          {[
            { key: 'old_password', label: 'Joriy parol', showKey: 'old' },
            { key: 'new_password', label: 'Yangi parol', showKey: 'new' },
            { key: 'confirm', label: 'Yangi parolni tasdiqlash', showKey: 'confirm' },
          ].map(({ key, label, showKey }) => (
            <div key={key}>
              <label className="label">{label}</label>
              <div className="relative">
                <input
                  type={show[showKey] ? 'text' : 'password'}
                  className="input pr-10"
                  value={form[key]}
                  onChange={e => setForm(f => ({ ...f, [key]: e.target.value }))}
                  required
                  minLength={4}
                />
                <button type="button" onClick={() => setShow(s => ({ ...s, [showKey]: !s[showKey] }))}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600">
                  <EyeIcon open={show[showKey]} />
                </button>
              </div>
            </div>
          ))}
          <button type="submit" disabled={loading} className="btn-primary">
            {loading ? 'Saqlanmoqda...' : 'Parolni o\'zgartirish'}
          </button>
        </form>
      </div>
    </div>
  );
}
