import { useEffect, useState } from 'react';
import api from '../api';
import toast from 'react-hot-toast';

const MONTHS = ['Yanvar','Fevral','Mart','Aprel','May','Iyun','Iyul','Avgust','Sentabr','Oktabr','Noyabr','Dekabr'];
const fmt = n => new Intl.NumberFormat('uz-UZ').format(Math.round(n || 0));

// Barchasini to'lash modali
function PayAllModal({ list, month, year, onClose, onPaid }) {
  const unpaid = list.filter(r => !r.is_paid);
  const totalSum = unpaid.reduce((s, r) => s + (r.total_amount || 0), 0);
  const [paying, setPaying] = useState(false);
  const [done, setDone] = useState(false);
  const [progress, setProgress] = useState(0);

  const handlePayAll = async () => {
    if (!confirm(`${unpaid.length} ta xodimga jami ${fmt(totalSum)} so'm to'lansinmi?`)) return;
    setPaying(true);
    try {
      // Har birini ketma-ket to'laymiz
      for (let i = 0; i < unpaid.length; i++) {
        const item = unpaid[i];
        await api.patch(`/salary/${item.id}/pay`, {
          card_number: item.emp_card || item.card_number || ''
        });
        setProgress(Math.round(((i + 1) / unpaid.length) * 100));
      }
      setDone(true);
      toast.success(`${unpaid.length} ta xodimga maosh to'landi!`);
      onPaid();
    } catch (err) {
      toast.error(err.response?.data?.error || 'Xatolik yuz berdi');
    } finally {
      setPaying(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-md overflow-hidden">
        {/* Header */}
        <div className="bg-gradient-to-r from-emerald-500 to-green-600 p-5 text-white">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="font-bold text-lg">Barchasiga maosh to'lash</h3>
              <p className="text-white/70 text-sm">{MONTHS[month-1]} {year}</p>
            </div>
            {!paying && (
              <button onClick={onClose} className="bg-white/20 hover:bg-white/30 p-2 rounded-lg transition-colors">
                <svg xmlns="http://www.w3.org/2000/svg" className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            )}
          </div>
        </div>

        <div className="p-5 space-y-4">
          {done ? (
            // Muvaffaqiyat
            <div className="text-center py-6">
              <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4">
                <svg xmlns="http://www.w3.org/2000/svg" className="w-8 h-8 text-green-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M5 13l4 4L19 7" />
                </svg>
              </div>
              <h3 className="text-xl font-bold text-slate-800 mb-1">To'lovlar amalga oshirildi!</h3>
              <p className="text-slate-500">{unpaid.length} ta xodimga jami</p>
              <p className="text-2xl font-bold text-green-600 mt-1">{fmt(totalSum)} so'm</p>
              <button onClick={onClose} className="btn-primary mt-5 w-full">Yopish</button>
            </div>
          ) : paying ? (
            // Jarayon
            <div className="py-4 space-y-4">
              <div className="text-center">
                <div className="animate-spin w-10 h-10 border-4 border-green-500 border-t-transparent rounded-full mx-auto mb-3"></div>
                <p className="text-slate-600 font-medium">To'lanmoqda...</p>
                <p className="text-slate-400 text-sm">{progress}% bajarildi</p>
              </div>
              <div className="h-3 bg-slate-100 rounded-full overflow-hidden">
                <div className="h-full bg-gradient-to-r from-emerald-500 to-green-500 rounded-full transition-all duration-300"
                  style={{ width: `${progress}%` }} />
              </div>
            </div>
          ) : (
            // Tasdiqlash
            <>
              {/* Umumiy ma'lumot */}
              <div className="bg-green-50 rounded-xl p-4 space-y-2">
                <div className="flex justify-between text-sm">
                  <span className="text-slate-500">To'lanmagan xodimlar</span>
                  <span className="font-bold text-slate-700">{unpaid.length} ta</span>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-slate-500">Allaqachon to'langan</span>
                  <span className="font-medium text-green-600">{list.length - unpaid.length} ta</span>
                </div>
                <div className="flex justify-between pt-2 border-t border-green-100">
                  <span className="font-bold text-slate-700">Jami o'tkaziladi</span>
                  <span className="font-bold text-green-600 text-lg">{fmt(totalSum)} so'm</span>
                </div>
              </div>

              {/* Xodimlar ro'yxati */}
              <div className="max-h-52 overflow-y-auto rounded-xl border border-slate-100">
                {unpaid.length === 0 ? (
                  <div className="text-center py-6 text-slate-400">
                    <p>Barcha xodimlar to'langan ✓</p>
                  </div>
                ) : unpaid.map(item => (
                  <div key={item.id} className="flex items-center justify-between px-4 py-2.5 border-b border-slate-50 hover:bg-slate-50">
                    <div>
                      <p className="text-sm font-medium text-slate-700">{item.last_name} {item.first_name}</p>
                      <p className="text-xs text-slate-400">
                        {item.emp_card ? item.emp_card.replace(/(\d{4})/g,'$1 ').trim() : 'Karta yo\'q'}
                      </p>
                    </div>
                    <span className="font-bold text-slate-800 text-sm">{fmt(item.total_amount)} so'm</span>
                  </div>
                ))}
              </div>

              {unpaid.length > 0 && (
                <button onClick={handlePayAll}
                  className="w-full bg-gradient-to-r from-emerald-500 to-green-600 hover:from-emerald-600 hover:to-green-700 text-white py-3 rounded-xl font-bold transition-all shadow-md flex items-center justify-center gap-2">
                  <svg xmlns="http://www.w3.org/2000/svg" className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 9V7a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2m2 4h10a2 2 0 002-2v-6a2 2 0 00-2-2H9a2 2 0 00-2 2v6a2 2 0 002 2zm7-5a2 2 0 11-4 0 2 2 0 014 0z" />
                  </svg>
                  {unpaid.length} ta xodimga {fmt(totalSum)} so'm to'lash
                </button>
              )}
            </>
          )}
        </div>
      </div>
    </div>
  );
}

// To'lov modali
function PayModal({ item, onClose, onPaid }) {
  const [preview, setPreview] = useState(null);
  const [method, setMethod] = useState('transfer'); // 'transfer' | 'cash'
  const [senderCard, setSenderCard] = useState('');
  const [receiverCard, setReceiverCard] = useState('');
  const [paying, setPaying] = useState(false);
  const [done, setDone] = useState(false);

  useEffect(() => {
    api.get(`/salary/preview/${item.employee_id}`, {
      params: { month: item.month, year: item.year }
    }).then(r => {
      setPreview(r.data);
      setReceiverCard(r.data.card_number || item.emp_card || '');
    });
  }, []);

  const formatCard = (val) => val.replace(/\D/g, '').slice(0, 16).replace(/(\d{4})/g, '$1 ').trim();

  const handlePay = async () => {
    if (method === 'transfer') {
      if (!senderCard || senderCard.replace(/\s/g,'').length < 16) { toast.error('To\'lov qiluvchi kartasini kiriting'); return; }
      if (!receiverCard || receiverCard.replace(/\s/g,'').length < 16) { toast.error('Xodim kartasini kiriting'); return; }
    }
    setPaying(true);
    try {
      await api.patch(`/salary/${item.id}/pay`, {
        card_number: method === 'transfer' ? receiverCard : null,
        sender_card: method === 'transfer' ? senderCard : null,
        payment_method: method
      });
      setDone(true);
      toast.success(`${fmt(item.total_amount)} so'm ${method === 'cash' ? 'naqd' : 'o\'tkazma'} orqali to'landi!`);
      onPaid();
    } catch (err) {
      toast.error(err.response?.data?.error || 'Xatolik');
    } finally { setPaying(false); }
  };

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-md overflow-hidden">
        {/* Header */}
        <div className="bg-gradient-to-r from-indigo-500 to-purple-600 p-5 text-white">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="font-bold text-lg">{item.last_name} {item.first_name}</h3>
              <p className="text-white/70 text-sm">{item.position} — {MONTHS[item.month-1]} {item.year}</p>
            </div>
            <button onClick={onClose} className="bg-white/20 hover:bg-white/30 p-2 rounded-lg">
              <svg xmlns="http://www.w3.org/2000/svg" className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          </div>
        </div>

        <div className="p-5 space-y-4">
          {done ? (
            <div className="text-center py-6">
              <div className="text-5xl mb-3">{method === 'cash' ? '💵' : '💳'}</div>
              <h3 className="text-xl font-bold text-slate-800 mb-1">To'lov amalga oshirildi!</h3>
              <p className="text-2xl font-bold text-green-600 mt-2">{fmt(item.total_amount)} so'm</p>
              <p className="text-slate-500 text-sm mt-1">{method === 'cash' ? 'Naqd pul berildi' : 'Kartaga o\'tkazildi'}</p>
              <button onClick={onClose} className="btn-primary mt-5 w-full">Yopish</button>
            </div>
          ) : !preview ? (
            <div className="flex justify-center py-8">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-indigo-500"></div>
            </div>
          ) : (
            <>
              {/* Statistika */}
              <div className="bg-slate-50 rounded-xl p-4">
                <p className="text-sm font-semibold text-slate-600 mb-3">Bu oygi ish statistikasi</p>
                <div className="grid grid-cols-3 gap-3">
                  <div className="text-center bg-green-50 rounded-lg p-2">
                    <p className="text-xl font-bold text-green-600">{preview.stats.present_days || 0}</p>
                    <p className="text-xs text-slate-500">Keldi</p>
                  </div>
                  <div className="text-center bg-red-50 rounded-lg p-2">
                    <p className="text-xl font-bold text-red-500">{preview.stats.absent_days || 0}</p>
                    <p className="text-xs text-slate-500">Kelmadi</p>
                  </div>
                  <div className="text-center bg-amber-50 rounded-lg p-2">
                    <p className="text-xl font-bold text-amber-500">{Math.round(preview.stats.total_hours || 0)}</p>
                    <p className="text-xs text-slate-500">Soat</p>
                  </div>
                </div>
              </div>

              {/* Maosh */}
              <div className="bg-indigo-50 rounded-xl p-4 space-y-2">
                <div className="flex justify-between text-sm"><span className="text-slate-500">Ishlagan kunlar</span><span className="font-medium">{preview.stats.worked_days} kun</span></div>
                <div className="flex justify-between text-sm"><span className="text-slate-500">Asosiy maosh</span><span className="font-medium">{fmt(item.base_amount)} so'm</span></div>
                {item.bonus > 0 && <div className="flex justify-between text-sm"><span className="text-slate-500">Bonus</span><span className="text-green-600">+{fmt(item.bonus)} so'm</span></div>}
                {item.deduction > 0 && <div className="flex justify-between text-sm"><span className="text-slate-500">Jarima</span><span className="text-red-500">-{fmt(item.deduction)} so'm</span></div>}
                <div className="flex justify-between pt-2 border-t border-indigo-200">
                  <span className="font-bold text-slate-700">Jami to'lov</span>
                  <span className="font-bold text-indigo-600 text-lg">{fmt(item.total_amount)} so'm</span>
                </div>
              </div>

              {/* To'lov usuli tanlash */}
              <div>
                <p className="label">To'lov usuli</p>
                <div className="grid grid-cols-2 gap-3">
                  <button onClick={() => setMethod('transfer')}
                    className={`py-3 rounded-xl border-2 font-medium text-sm transition-all flex flex-col items-center gap-1 ${method==='transfer'?'border-indigo-500 bg-indigo-50 text-indigo-600':'border-slate-200 text-slate-500 hover:border-slate-300'}`}>
                    <span className="text-2xl">💳</span>
                    O'tkazma
                  </button>
                  <button onClick={() => setMethod('cash')}
                    className={`py-3 rounded-xl border-2 font-medium text-sm transition-all flex flex-col items-center gap-1 ${method==='cash'?'border-green-500 bg-green-50 text-green-600':'border-slate-200 text-slate-500 hover:border-slate-300'}`}>
                    <span className="text-2xl">💵</span>
                    Naqd
                  </button>
                </div>
              </div>

              {/* O'tkazma uchun karta */}
              {method === 'transfer' && (
                <div className="space-y-3">
                  <div>
                    <label className="label">To'lov qiluvchi kartasi (admin)</label>
                    <input className="input font-mono tracking-widest" placeholder="8600 0000 0000 0000"
                      maxLength={19} value={senderCard} onChange={e => setSenderCard(formatCard(e.target.value))} />
                    {senderCard && <p className="text-xs text-slate-400 mt-1">{senderCard.replace(/\s/g,'').length}/16</p>}
                  </div>
                  <div>
                    <label className="label">Xodim kartasi</label>
                    <input className="input font-mono tracking-widest" placeholder="8600 1234 5678 9012"
                      maxLength={19} value={receiverCard} onChange={e => setReceiverCard(formatCard(e.target.value))} />
                    {receiverCard && <p className="text-xs text-slate-400 mt-1">{receiverCard.replace(/\s/g,'').length}/16</p>}
                  </div>
                </div>
              )}

              {/* Naqd uchun tasdiqlash */}
              {method === 'cash' && (
                <div className="bg-green-50 rounded-xl p-4 border border-green-100">
                  <div className="flex items-center gap-3">
                    <span className="text-3xl">💵</span>
                    <div>
                      <p className="font-semibold text-green-700">{fmt(item.total_amount)} so'm naqd beriladi</p>
                      <p className="text-sm text-green-600">{item.last_name} {item.first_name} ga qo'lma-qo'l</p>
                    </div>
                  </div>
                </div>
              )}

              {/* Tugma */}
              <button onClick={handlePay} disabled={paying}
                className={`w-full py-3 rounded-xl font-bold text-base transition-all shadow-md flex items-center justify-center gap-2 text-white ${method==='cash'?'bg-gradient-to-r from-green-500 to-emerald-600':'bg-gradient-to-r from-indigo-500 to-purple-600'}`}>
                {paying ? 'Amalga oshirilmoqda...' : method === 'cash'
                  ? `💵 ${fmt(item.total_amount)} so'm naqd to'landi`
                  : `💳 ${fmt(item.total_amount)} so'm o'tkazish`}
              </button>
            </>
          )}
        </div>
      </div>
    </div>
  );
}

export default function Salary() {
  const now = new Date();
  const [month, setMonth] = useState(now.getMonth() + 1);
  const [year, setYear] = useState(now.getFullYear());
  const [list, setList] = useState([]);
  const [search, setSearch] = useState('');
  const [loading, setLoading] = useState(false);
  const [editing, setEditing] = useState(null);
  const [editForm, setEditForm] = useState({ bonus: 0, deduction: 0, note: '' });
  const [payItem, setPayItem] = useState(null);
  const [showPayAll, setShowPayAll] = useState(false);

  const fetchList = async () => {
    setLoading(true);
    try {
      const res = await api.get('/salary', { params: { month, year } });
      setList(res.data);
    } finally { setLoading(false); }
  };

  useEffect(() => { fetchList(); }, [month, year]);

  const calculate = async () => {
    try {
      const res = await api.post('/salary/calculate', { month, year });
      toast.success(`${res.data.count} ta maosh hisoblandi`);
      fetchList();
    } catch { toast.error('Xatolik'); }
  };

  const saveEdit = async (id) => {
    try {
      await api.put(`/salary/${id}`, editForm);
      toast.success('Yangilandi');
      setEditing(null);
      fetchList();
    } catch { toast.error('Xatolik'); }
  };

  const total = list.reduce((s, r) => s + (r.total_amount || 0), 0);
  const paid = list.filter(r => r.is_paid).reduce((s, r) => s + (r.total_amount || 0), 0);
  const paidCount = list.filter(r => r.is_paid).length;
  const filtered = search
    ? list.filter(r => `${r.last_name} ${r.first_name}`.toLowerCase().includes(search.toLowerCase()))
    : list;

  return (
    <div className="p-6 space-y-5">
      {payItem && <PayModal item={payItem} onClose={() => setPayItem(null)} onPaid={fetchList} />}
      {showPayAll && <PayAllModal list={list} month={month} year={year} onClose={() => setShowPayAll(false)} onPaid={fetchList} />}

      <div className="flex items-center justify-between flex-wrap gap-3">
        <div>
          <h1 className="text-2xl font-bold text-slate-800">Maosh</h1>
          <p className="text-slate-500 text-sm">{paidCount}/{list.length} ta to'langan</p>
        </div>
        <div className="flex items-center gap-3 flex-wrap">
          <input
            className="input w-48"
            placeholder="Xodim qidirish..."
            value={search}
            onChange={e => setSearch(e.target.value)}
          />
          <select className="input w-auto" value={month} onChange={e => setMonth(Number(e.target.value))}>
            {MONTHS.map((m, i) => <option key={i} value={i+1}>{m}</option>)}
          </select>
          <select className="input w-auto" value={year} onChange={e => setYear(Number(e.target.value))}>
            {[2023,2024,2025,2026].map(y => <option key={y} value={y}>{y}</option>)}
          </select>
          <button onClick={calculate} className="btn-secondary flex items-center gap-2">
            <svg xmlns="http://www.w3.org/2000/svg" className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 7h6m0 10v-3m-3 3h.01M9 17h.01M9 14h.01M12 14h.01M15 11h.01M12 11h.01M9 11h.01M7 21h10a2 2 0 002-2V5a2 2 0 00-2-2H7a2 2 0 00-2 2v14a2 2 0 002 2z" />
            </svg>
            Hisoblash
          </button>
          <button onClick={() => window.open(`/api/export/salary-report?month=${month}&year=${year}&token=${localStorage.getItem('token')}`, '_blank')}
            className="btn-secondary flex items-center gap-2">
            <svg xmlns="http://www.w3.org/2000/svg" className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 17h2a2 2 0 002-2v-4a2 2 0 00-2-2H5a2 2 0 00-2 2v4a2 2 0 002 2h2m2 4h6a2 2 0 002-2v-4a2 2 0 00-2-2H9a2 2 0 00-2 2v4a2 2 0 002 2zm8-12V5a2 2 0 00-2-2H9a2 2 0 00-2 2v4h10z" />
            </svg>
            Hisobot
          </button>
          {list.filter(r => !r.is_paid).length > 0 && (
            <button onClick={() => setShowPayAll(true)}
              className="flex items-center gap-2 bg-gradient-to-r from-emerald-500 to-green-600 hover:from-emerald-600 hover:to-green-700 text-white px-4 py-2 rounded-lg font-medium transition-all shadow-sm">
              <svg xmlns="http://www.w3.org/2000/svg" className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 9V7a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2m2 4h10a2 2 0 002-2v-6a2 2 0 00-2-2H9a2 2 0 00-2 2v6a2 2 0 002 2zm7-5a2 2 0 11-4 0 2 2 0 014 0z" />
              </svg>
              Barchasiga to'lash ({list.filter(r => !r.is_paid).length})
            </button>
          )}
        </div>
      </div>

      {/* Umumiy */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div className="card bg-gradient-to-br from-slate-700 to-slate-800 text-white">
          <p className="text-slate-300 text-sm">Jami maosh</p>
          <p className="text-2xl font-bold mt-1">{fmt(total)} so'm</p>
        </div>
        <div className="card bg-gradient-to-br from-green-500 to-emerald-600 text-white">
          <p className="text-green-100 text-sm">To'langan</p>
          <p className="text-2xl font-bold mt-1">{fmt(paid)} so'm</p>
        </div>
        <div className="card bg-gradient-to-br from-amber-500 to-orange-500 text-white">
          <p className="text-amber-100 text-sm">Qolgan</p>
          <p className="text-2xl font-bold mt-1">{fmt(total - paid)} so'm</p>
        </div>
      </div>

      {/* Jadval */}
      <div className="card p-0 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead className="bg-slate-50 border-b border-slate-100">
              <tr>
                <th className="text-left px-5 py-3 text-slate-600 font-medium">Ishchi</th>
                <th className="text-left px-5 py-3 text-slate-600 font-medium">Bo'lim</th>
                <th className="text-right px-5 py-3 text-slate-600 font-medium">Kun</th>
                <th className="text-right px-5 py-3 text-slate-600 font-medium">Asosiy</th>
                <th className="text-right px-5 py-3 text-slate-600 font-medium">Bonus</th>
                <th className="text-right px-5 py-3 text-slate-600 font-medium">Jami</th>
                <th className="text-left px-5 py-3 text-slate-600 font-medium">Karta</th>
                <th className="text-center px-5 py-3 text-slate-600 font-medium">Holat</th>
                <th className="text-right px-5 py-3 text-slate-600 font-medium">Amal</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-50">
              {loading ? (
                <tr><td colSpan={9} className="text-center py-12 text-slate-400">Yuklanmoqda...</td></tr>
              ) : filtered.length === 0 ? (
                <tr><td colSpan={9} className="text-center py-12">
                  <p className="text-slate-400 mb-3">Hisoblangan emas</p>
                  <button onClick={calculate} className="btn-primary text-sm">Hisoblash</button>
                </td></tr>
              ) : filtered.map(item => (
                <>
                  <tr key={item.id} className={`hover:bg-slate-50 transition-colors ${item.is_paid ? 'opacity-60' : ''}`}>
                    <td className="px-5 py-3 font-medium text-slate-800">{item.last_name} {item.first_name}</td>
                    <td className="px-5 py-3 text-slate-500 text-xs">{item.department || '—'}</td>
                    <td className="px-5 py-3 text-right text-slate-600">{item.worked_days}</td>
                    <td className="px-5 py-3 text-right text-slate-600">{fmt(item.base_amount)}</td>
                    <td className="px-5 py-3 text-right text-green-600">{item.bonus > 0 ? `+${fmt(item.bonus)}` : '—'}</td>
                    <td className="px-5 py-3 text-right font-bold text-slate-800">{fmt(item.total_amount)}</td>
                    <td className="px-5 py-3 text-slate-500 font-mono text-xs">
                      {item.emp_card || item.card_number ? (item.emp_card || item.card_number).replace(/(\d{4})/g,'$1 ').trim() : '—'}
                    </td>
                    <td className="px-5 py-3 text-center">
                      <span className={`px-2 py-0.5 rounded-full text-xs font-medium ${item.is_paid ? 'bg-green-100 text-green-700' : 'bg-amber-100 text-amber-700'}`}>
                        {item.is_paid ? '✓ To\'landi' : 'Kutilmoqda'}
                      </span>
                    </td>
                    <td className="px-5 py-3">
                      <div className="flex items-center justify-end gap-1">
                        <button onClick={() => { setEditing(item.id); setEditForm({ bonus: item.bonus||0, deduction: item.deduction||0, note: item.note||'' }); }}
                          className="p-1.5 text-slate-400 hover:text-indigo-600 hover:bg-indigo-50 rounded-lg transition-colors" title="Tahrirlash">
                          <svg xmlns="http://www.w3.org/2000/svg" className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                          </svg>
                        </button>
                        {!item.is_paid && (
                          <button onClick={() => setPayItem(item)}
                            className="p-1.5 text-slate-400 hover:text-green-600 hover:bg-green-50 rounded-lg transition-colors" title="To'lash">
                            <svg xmlns="http://www.w3.org/2000/svg" className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 9V7a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2m2 4h10a2 2 0 002-2v-6a2 2 0 00-2-2H9a2 2 0 00-2 2v6a2 2 0 002 2zm7-5a2 2 0 11-4 0 2 2 0 014 0z" />
                            </svg>
                          </button>
                        )}
                        {item.is_paid && (
                          <button onClick={() => window.open(`/api/export/salary-slip/${item.id}?token=${localStorage.getItem('token')}`, '_blank')}
                            className="p-1.5 text-slate-400 hover:text-indigo-600 hover:bg-indigo-50 rounded-lg transition-colors" title="Chek">
                            <svg xmlns="http://www.w3.org/2000/svg" className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 17h2a2 2 0 002-2v-4a2 2 0 00-2-2H5a2 2 0 00-2 2v4a2 2 0 002 2h2m2 4h6a2 2 0 002-2v-4a2 2 0 00-2-2H9a2 2 0 00-2 2v4a2 2 0 002 2zm8-12V5a2 2 0 00-2-2H9a2 2 0 00-2 2v4h10z" />
                            </svg>
                          </button>
                        )}
                      </div>
                    </td>
                  </tr>
                  {editing === item.id && (
                    <tr key={`e_${item.id}`} className="bg-indigo-50">
                      <td colSpan={9} className="px-5 py-4">
                        <div className="flex items-end gap-4 flex-wrap">
                          <div>
                            <label className="label text-xs">Bonus</label>
                            <input type="number" min="0" className="input w-32" value={editForm.bonus}
                              onChange={e => setEditForm(f => ({...f, bonus: Number(e.target.value)}))} />
                          </div>
                          <div>
                            <label className="label text-xs">Jarima</label>
                            <input type="number" min="0" className="input w-32" value={editForm.deduction}
                              onChange={e => setEditForm(f => ({...f, deduction: Number(e.target.value)}))} />
                          </div>
                          <div className="flex-1">
                            <label className="label text-xs">Izoh</label>
                            <input className="input" value={editForm.note}
                              onChange={e => setEditForm(f => ({...f, note: e.target.value}))} />
                          </div>
                          <div className="flex gap-2">
                            <button onClick={() => saveEdit(item.id)} className="btn-primary text-sm">Saqlash</button>
                            <button onClick={() => setEditing(null)} className="btn-secondary text-sm">Bekor</button>
                          </div>
                        </div>
                      </td>
                    </tr>
                  )}
                </>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
