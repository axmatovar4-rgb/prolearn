import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import api from '../api';
import toast from 'react-hot-toast';

export default function Login() {
  const [form, setForm] = useState({ username: '', password: '', birth_date: '', card_number: '' });
  const [showPass, setShowPass] = useState(false);
  const [loading, setLoading] = useState(false);
  const [isEmployee, setIsEmployee] = useState(false);
  const navigate = useNavigate();

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    try {
      const res = await api.post('/auth/login', form);
      localStorage.setItem('token', res.data.token);
      localStorage.setItem('user', JSON.stringify(res.data.user));
      toast.success('Xush kelibsiz!');
      navigate(res.data.user.role === 'admin' ? '/app' : '/app/profile');
    } catch (err) {
      toast.error(err.response?.data?.error || 'Xatolik yuz berdi');
    } finally {
      setLoading(false);
    }
  };

  const set = (k, v) => setForm(f => ({ ...f, [k]: v }));

  return (
    <div className="min-h-screen bg-[radial-gradient(circle_at_top_left,_rgba(6,182,212,0.20),_transparent_30%),linear-gradient(135deg,_#f8fbff_0%,_#eef7ff_45%,_#f5f3ff_100%)] flex items-center justify-center p-4">
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className="absolute -top-20 -left-12 h-64 w-64 rounded-full bg-cyan-400/20 blur-3xl" />
        <div className="absolute bottom-0 right-0 h-72 w-72 rounded-full bg-blue-500/20 blur-3xl" />
      </div>

      <div className="relative w-full max-w-md overflow-hidden rounded-[28px] border border-white/70 bg-white/90 shadow-[0_25px_80px_rgba(15,23,42,0.16)] backdrop-blur-xl">
        <div className="bg-gradient-to-r from-cyan-600 via-sky-600 to-blue-700 p-7 text-center">
          <div className="mx-auto mb-3 flex h-14 w-14 items-center justify-center rounded-2xl bg-white/15 shadow-lg shadow-cyan-900/20">
            <svg xmlns="http://www.w3.org/2000/svg" className="h-7 w-7 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.8} d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" />
            </svg>
          </div>
          <h2 className="text-xl font-semibold text-white">Kiro</h2>
          <p className="mt-1 text-sm text-cyan-100">Hisobingizga kiring</p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4 p-7">
          <div className="rounded-2xl bg-slate-50 p-4 text-sm text-slate-600">
            <p className="font-semibold text-slate-700">Zamonaviy HR boshqaruvi</p>
            <p className="mt-1 text-slate-500">Ishchilar, davomat va maoshni bitta joydan nazorat qiling.</p>
          </div>

          <div>
            <label className="label">Login yoki telefon</label>
            <input className="input" placeholder="admin yoki Karimov Jasur"
              value={form.username}
              onChange={e => {
                set('username', e.target.value);
                setIsEmployee(e.target.value.toLowerCase() !== 'admin');
              }}
              required />
          </div>

          <div>
            <label className="label">Parol</label>
            <div className="relative">
              <input type={showPass ? 'text' : 'password'} className="input pr-10"
                placeholder="••••••••" value={form.password}
                onChange={e => set('password', e.target.value)} required />
              <button type="button" onClick={() => setShowPass(!showPass)}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600">
                <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  {showPass
                    ? <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13.875 18.825A10.05 10.05 0 0112 19c-4.478 0-8.268-2.943-9.543-7a9.97 9.97 0 011.563-3.029m5.858.908a3 3 0 114.243 4.243M9.878 9.878l4.242 4.242M9.88 9.88l-3.29-3.29m7.532 7.532l3.29 3.29M3 3l3.59 3.59m0 0A9.953 9.953 0 0112 5c4.478 0 8.268 2.943 9.543 7a10.025 10.025 0 01-4.132 5.411m0 0L21 21" />
                    : <><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" /><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" /></>
                  }
                </svg>
              </button>
            </div>
          </div>

          {isEmployee && (
            <>
              <div>
                <label className="label">Tug'ilgan sana</label>
                <input type="date" className="input"
                  value={form.birth_date} onChange={e => set('birth_date', e.target.value)} required={isEmployee} />
              </div>
              <div>
                <label className="label">Karta raqam</label>
                <input className="input" placeholder="8600 1234 5678 9012"
                  maxLength={19}
                  value={form.card_number}
                  onChange={e => {
                    const val = e.target.value.replace(/\D/g, '').slice(0, 16);
                    set('card_number', val.replace(/(\d{4})/g, '$1 ').trim());
                  }} required={isEmployee} />
              </div>
            </>
          )}

          <button type="submit" disabled={loading}
            className="mt-2 w-full rounded-xl bg-gradient-to-r from-cyan-600 to-blue-700 py-2.5 font-medium text-white shadow-lg shadow-cyan-600/20 transition-all hover:from-cyan-700 hover:to-blue-800">
            {loading ? 'Yuklanmoqda...' : 'Kirish'}
          </button>
        </form>
      </div>
    </div>
  );
}
