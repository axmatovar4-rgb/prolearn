import { useEffect, useState, useRef } from 'react';
import api from '../api';
import toast from 'react-hot-toast';

const getUser = () => { try { return JSON.parse(localStorage.getItem('user')); } catch { return null; } };
const fmt = n => new Intl.NumberFormat('uz-UZ').format(Math.round(n || 0));
const MONTHS = ['','Yanvar','Fevral','Mart','Aprel','May','Iyun','Iyul','Avgust','Sentabr','Oktabr','Noyabr','Dekabr'];

export default function MyProfile() {
  const user = getUser();
  const [emp, setEmp] = useState(null);
  const [tab, setTab] = useState('overview');
  const [stats, setStats] = useState(null);
  const [attendance, setAttendance] = useState([]);
  const [prevStats, setPrevStats] = useState(null);
  const [salary, setSalary] = useState([]);
  const [vacation, setVacation] = useState(null);
  const [evaluations, setEvaluations] = useState([]);
  const [evalAvg, setEvalAvg] = useState(null);
  const [editMode, setEditMode] = useState(false);
  const [editForm, setEditForm] = useState({});
  const [photoFile, setPhotoFile] = useState(null);
  const [photoPreview, setPhotoPreview] = useState(null);
  const fileRef = useRef();

  const now = new Date();
  const month = now.getMonth() + 1;
  const year = now.getFullYear();
  const prevDate = new Date(now.getFullYear(), now.getMonth() - 1, 1);
  const prevMonth = prevDate.getMonth() + 1;
  const prevYear = prevDate.getFullYear();

  useEffect(() => {
    if (!user?.employee_id) return;
    const id = user.employee_id;
    api.get(`/employees/${id}`).then(r => { setEmp(r.data); setEditForm(r.data); }).catch(() => {});
    api.get(`/attendance/employee/${id}`, { params: { month, year } }).then(r => setAttendance(r.data)).catch(() => {});
    api.get(`/attendance/stats/${id}`, { params: { month, year } }).then(r => setStats(r.data)).catch(() => {});
    api.get(`/attendance/stats/${id}`, { params: { month: prevMonth, year: prevYear } }).then(r => setPrevStats(r.data)).catch(() => {});
    api.get(`/salary/employee/${id}`).then(r => setSalary(r.data)).catch(() => {});
    api.get(`/vacation/balance/${id}`).then(r => setVacation(r.data)).catch(() => {});
    api.get('/evaluation', { params: { employee_id: id, year } }).then(r => setEvaluations(r.data)).catch(() => {});
    api.get(`/evaluation/avg/${id}`, { params: { year } }).then(r => setEvalAvg(r.data)).catch(() => {});
  }, []);

  const saveProfile = async () => {
    try {
      const fd = new FormData();
      Object.entries(editForm).forEach(([k, v]) => v != null && fd.append(k, v));
      if (photoFile) fd.append('photo', photoFile);
      await api.put(`/employees/${emp.id}`, fd);
      toast.success('Profil yangilandi');
      const res = await api.get(`/employees/${emp.id}`);
      setEmp(res.data);
      setEditMode(false);
    } catch { toast.error('Xatolik'); }
  };

  const openSlip = (id) => {
    const token = localStorage.getItem('token');
    window.open(`/api/export/salary-slip/${id}?token=${token}`, '_blank');
  };

  const compare = (curr, prev) => {
    if (!prev || prev === 0) return null;
    const diff = curr - prev;
    const pct = Math.round((diff / prev) * 100);
    return { diff, pct, up: diff >= 0 };
  };

  const thisMonthSalary = salary.find(s => s.month === month && s.year === year);
  const prevMonthSalary = salary.find(s => s.month === prevMonth && s.year === prevYear);

  if (!user?.employee_id) return (
    <div className="p-6">
      <div className="bg-amber-50 border border-amber-200 rounded-xl p-5 text-center">
        <p className="text-amber-700">Profilingiz hali boglanmagan. Admin bilan boglaning.</p>
      </div>
    </div>
  );

  return (
    <div className="p-4 sm:p-6 space-y-5 max-w-4xl">
      <div className="flex items-center justify-between flex-wrap gap-3">
        <div>
          <h1 className="text-2xl font-bold text-slate-800 dark:text-white">Mening profilim</h1>
          <p className="text-slate-500 text-sm">Shaxsiy malumotlar va statistika</p>
        </div>
        <button onClick={() => setEditMode(!editMode)} className={editMode ? 'btn-secondary' : 'btn-primary'}>
          {editMode ? 'Bekor qilish' : 'Tahrirlash'}
        </button>
      </div>

      <div className="bg-gradient-to-r from-indigo-600 to-purple-600 rounded-2xl p-5 text-white shadow-lg">
        <div className="flex items-center gap-4 flex-wrap">
          <div className="relative flex-shrink-0">
            <div className="w-20 h-20 rounded-2xl bg-white/20 overflow-hidden flex items-center justify-center text-3xl font-bold">
              {(photoPreview || emp?.photo) ? (
                <img src={photoPreview || emp?.photo} alt="" className="w-full h-full object-cover" />
              ) : (
                <span>{emp?.first_name?.[0] || user?.username?.[0]?.toUpperCase()}</span>
              )}
            </div>
            {editMode && (
              <button onClick={() => fileRef.current?.click()}
                className="absolute -bottom-1 -right-1 bg-white text-indigo-600 p-1.5 rounded-full shadow-md">
                📷
              </button>
            )}
            <input ref={fileRef} type="file" accept="image/*" className="hidden" onChange={e => {
              const f = e.target.files[0];
              if (f) { setPhotoFile(f); setPhotoPreview(URL.createObjectURL(f)); }
            }} />
          </div>
          <div className="flex-1">
            {editMode ? (
              <div className="grid grid-cols-2 gap-2">
                <input className="input bg-white/20 border-white/30 text-white placeholder-white/60 text-sm" placeholder="Familiya" value={editForm.last_name || ''} onChange={e => setEditForm(f => ({...f, last_name: e.target.value}))} />
                <input className="input bg-white/20 border-white/30 text-white placeholder-white/60 text-sm" placeholder="Ism" value={editForm.first_name || ''} onChange={e => setEditForm(f => ({...f, first_name: e.target.value}))} />
                <input className="input bg-white/20 border-white/30 text-white placeholder-white/60 text-sm col-span-2" placeholder="Otasining ismi" value={editForm.middle_name || ''} onChange={e => setEditForm(f => ({...f, middle_name: e.target.value}))} />
                <input className="input bg-white/20 border-white/30 text-white placeholder-white/60 text-sm" placeholder="Telefon" value={editForm.phone || ''} onChange={e => setEditForm(f => ({...f, phone: e.target.value}))} />
                <input className="input bg-white/20 border-white/30 text-white placeholder-white/60 text-sm" placeholder="Shahar" value={editForm.city || ''} onChange={e => setEditForm(f => ({...f, city: e.target.value}))} />
                <input type="date" className="input bg-white/20 border-white/30 text-white text-sm" value={editForm.birth_date || ''} onChange={e => setEditForm(f => ({...f, birth_date: e.target.value}))} />
                <input className="input bg-white/20 border-white/30 text-white placeholder-white/60 text-sm font-mono" placeholder="Karta raqam" maxLength={19} value={editForm.card_number || ''} onChange={e => { const v = e.target.value.replace(/\D/g,'').slice(0,16); setEditForm(f => ({...f, card_number: v.replace(/(\d{4})/g,'$1 ').trim()})); }} />
                <button onClick={saveProfile} className="col-span-2 bg-white text-indigo-600 py-2 rounded-lg font-bold hover:bg-indigo-50">Saqlash</button>
              </div>
            ) : (
              <>
                <h2 className="text-xl font-bold">{emp?.last_name} {emp?.first_name} {emp?.middle_name}</h2>
                <p className="text-white/70 text-sm mt-0.5">{emp?.position || 'Xodim'} {emp?.department ? `— ${emp.department}` : ''}</p>
                <div className="flex flex-wrap gap-3 mt-3 text-sm">
                  {emp?.phone && <span className="text-white/80">📞 {emp.phone}</span>}
                  {emp?.city && <span className="text-white/80">📍 {emp.city}</span>}
                  {emp?.birth_date && <span className="text-white/80">🎂 {emp.birth_date}</span>}
                  {emp?.hire_date && <span className="text-white/80">📅 {emp.hire_date}</span>}
                  {emp?.card_number && <span className="text-white/80 font-mono">💳 {emp.card_number}</span>}
                </div>
              </>
            )}
          </div>
        </div>
      </div>

      <div className="flex gap-1 bg-slate-100 dark:bg-slate-800 rounded-xl p-1 overflow-x-auto">
        {[['overview','📊 Umumiy'],['attendance','📅 Davomat'],['salary','💰 Maosh'],['evaluations','⭐ Baholash']].map(([v,l]) => (
          <button key={v} onClick={() => setTab(v)}
            className={`flex-1 py-2 rounded-lg text-xs sm:text-sm font-medium transition-colors whitespace-nowrap ${tab===v?'bg-white dark:bg-slate-700 shadow text-indigo-600':'text-slate-500'}`}>
            {l}
          </button>
        ))}
      </div>

      {tab === 'overview' && (
        <div className="space-y-4">
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
            {[
              { label: 'Keldi (bu oy)', value: stats?.present_days || 0, color: 'text-green-600', bg: 'bg-green-50', prev: prevStats?.present_days },
              { label: 'Kelmadi', value: stats?.absent_days || 0, color: 'text-red-500', bg: 'bg-red-50', prev: prevStats?.absent_days },
              { label: 'Ish soat', value: Math.round(stats?.total_hours || 0), color: 'text-indigo-600', bg: 'bg-indigo-50', prev: Math.round(prevStats?.total_hours || 0) },
              { label: "Tatil qoldi", value: vacation?.remaining ?? 24, color: 'text-amber-600', bg: 'bg-amber-50' },
            ].map((s, i) => {
              const cmp = s.prev !== undefined ? compare(s.value, s.prev) : null;
              return (
                <div key={i} className={`rounded-xl p-4 ${s.bg} border border-white`}>
                  <p className={`text-3xl font-bold ${s.color}`}>{s.value}</p>
                  <p className="text-slate-500 text-xs mt-1">{s.label}</p>
                  {cmp && (
                    <p className={`text-xs mt-1 font-medium ${cmp.up ? 'text-green-500' : 'text-red-400'}`}>
                      {cmp.up ? '▲' : '▼'} {Math.abs(cmp.pct)}%
                    </p>
                  )}
                </div>
              );
            })}
          </div>

          <div className="card">
            <h3 className="font-semibold text-slate-700 dark:text-slate-200 mb-4">Ikki oylik taqqoslama</h3>
            <div className="grid grid-cols-2 gap-4">
              {[
                { month: prevMonth, year: prevYear, s: prevStats, sal: prevMonthSalary, label: `${MONTHS[prevMonth]} (otgan)` },
                { month, year, s: stats, sal: thisMonthSalary, label: `${MONTHS[month]} (bu oy)`, current: true },
              ].map((item, i) => (
                <div key={i} className={`rounded-xl p-4 border ${item.current ? 'bg-indigo-50 border-indigo-100' : 'bg-slate-50 border-slate-100'}`}>
                  <p className={`font-semibold text-sm mb-3 ${item.current ? 'text-indigo-600' : 'text-slate-600'}`}>{item.label}</p>
                  <div className="space-y-2 text-sm">
                    <div className="flex justify-between"><span className="text-slate-500">Keldi</span><span className="font-medium text-green-600">{item.s?.present_days || 0} kun</span></div>
                    <div className="flex justify-between"><span className="text-slate-500">Ish soat</span><span className="font-medium text-indigo-600">{Math.round(item.s?.total_hours || 0)} soat</span></div>
                    <div className="flex justify-between"><span className="text-slate-500">Kechikish</span><span className="font-medium text-amber-600">{item.s?.total_late || 0} daq</span></div>
                    <div className="flex justify-between pt-2 border-t border-slate-200">
                      <span className="text-slate-500">Maosh</span>
                      <span className="font-bold text-slate-700">{fmt(item.sal?.total_amount || 0)} som</span>
                    </div>
                    {item.sal && (
                      <div className="flex justify-between">
                        <span className="text-slate-500">Holat</span>
                        <span className={`text-xs font-medium ${item.sal.is_paid ? 'text-green-600' : 'text-amber-600'}`}>{item.sal.is_paid ? 'Tolandi' : 'Kutilmoqda'}</span>
                      </div>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </div>

          {salary.length > 0 && (
            <div className="card">
              <h3 className="font-semibold text-slate-700 dark:text-slate-200 mb-3">Bu yilgi maosh jami</h3>
              <div className="grid grid-cols-3 gap-3">
                <div className="text-center bg-slate-50 rounded-xl p-3">
                  <p className="text-lg font-bold text-slate-700">{fmt(salary.filter(s=>s.year===year).reduce((a,s)=>a+(s.total_amount||0),0))}</p>
                  <p className="text-xs text-slate-400 mt-1">Jami som</p>
                </div>
                <div className="text-center bg-green-50 rounded-xl p-3">
                  <p className="text-lg font-bold text-green-600">{fmt(salary.filter(s=>s.year===year&&s.is_paid).reduce((a,s)=>a+(s.total_amount||0),0))}</p>
                  <p className="text-xs text-slate-400 mt-1">Tolangan</p>
                </div>
                <div className="text-center bg-amber-50 rounded-xl p-3">
                  <p className="text-lg font-bold text-amber-600">{salary.filter(s=>s.year===year).length}</p>
                  <p className="text-xs text-slate-400 mt-1">Oy ishlandi</p>
                </div>
              </div>
            </div>
          )}
        </div>
      )}

      {tab === 'attendance' && (
        <div className="space-y-4">
          <div className="grid grid-cols-3 gap-3">
            <div className="bg-green-50 rounded-xl p-4 text-center"><p className="text-3xl font-bold text-green-600">{stats?.present_days || 0}</p><p className="text-xs text-slate-500 mt-1">Keldi</p></div>
            <div className="bg-red-50 rounded-xl p-4 text-center"><p className="text-3xl font-bold text-red-500">{stats?.absent_days || 0}</p><p className="text-xs text-slate-500 mt-1">Kelmadi</p></div>
            <div className="bg-indigo-50 rounded-xl p-4 text-center"><p className="text-3xl font-bold text-indigo-600">{Math.round(stats?.total_hours || 0)}</p><p className="text-xs text-slate-500 mt-1">Ish soat</p></div>
          </div>
          {attendance.length > 0 ? (
            <div className="card p-0 overflow-hidden">
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead className="border-b bg-slate-50">
                    <tr>
                      <th className="text-left px-5 py-2.5 text-slate-500 font-medium">Sana</th>
                      <th className="text-left px-5 py-2.5 text-slate-500 font-medium">Holat</th>
                      <th className="text-right px-5 py-2.5 text-slate-500 font-medium">Soat</th>
                      <th className="text-right px-5 py-2.5 text-slate-500 font-medium">Kechikish</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-50">
                    {attendance.map(a => (
                      <tr key={a.id} className="hover:bg-slate-50">
                        <td className="px-5 py-2.5 text-slate-700">{a.date}</td>
                        <td className="px-5 py-2.5">
                          <span className={`px-2 py-0.5 rounded-full text-xs font-medium ${a.status==='present'?'bg-green-100 text-green-700':a.status==='absent'?'bg-red-100 text-red-600':'bg-amber-100 text-amber-700'}`}>
                            {a.status==='present'?'Keldi':a.status==='absent'?'Kelmadi':'Yarim kun'}
                          </span>
                        </td>
                        <td className="px-5 py-2.5 text-right text-slate-600">{a.work_hours || 0}h</td>
                        <td className="px-5 py-2.5 text-right text-amber-600">{a.late_minutes ? `${a.late_minutes} daq` : '—'}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          ) : (
            <div className="card text-center py-10 text-slate-400">Bu oy uchun davomat malumoti yoq</div>
          )}
        </div>
      )}

      {tab === 'salary' && (
        <div className="space-y-4">
          {salary.length === 0 ? (
            <div className="card text-center py-10 text-slate-400">Maosh malumotlari yoq</div>
          ) : (
            <div className="card p-0 overflow-hidden">
              <table className="w-full text-sm">
                <thead className="bg-slate-50 border-b">
                  <tr>
                    <th className="text-left px-5 py-3 text-slate-500 font-medium">Oy</th>
                    <th className="text-right px-5 py-3 text-slate-500 font-medium">Kun</th>
                    <th className="text-right px-5 py-3 text-slate-500 font-medium">Maosh</th>
                    <th className="text-center px-5 py-3 text-slate-500 font-medium">Holat</th>
                    <th className="text-center px-5 py-3 text-slate-500 font-medium">Chek</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-50">
                  {salary.map(s => (
                    <tr key={s.id} className="hover:bg-slate-50">
                      <td className="px-5 py-3 font-medium text-slate-700">
                        {MONTHS[s.month]} {s.year}
                        {s.month===month && s.year===year && <span className="ml-2 text-xs bg-indigo-100 text-indigo-600 px-1.5 py-0.5 rounded-full">Bu oy</span>}
                      </td>
                      <td className="px-5 py-3 text-right text-slate-600">{s.worked_days}</td>
                      <td className="px-5 py-3 text-right font-bold text-slate-800">{fmt(s.total_amount)} som</td>
                      <td className="px-5 py-3 text-center">
                        <span className={`px-2 py-0.5 rounded-full text-xs font-medium ${s.is_paid?'bg-green-100 text-green-700':'bg-amber-100 text-amber-700'}`}>
                          {s.is_paid ? 'Tolandi' : 'Kutilmoqda'}
                        </span>
                      </td>
                      <td className="px-5 py-3 text-center">
                        {s.is_paid && <button onClick={() => openSlip(s.id)} className="text-indigo-500 hover:text-indigo-700 text-xs">Chek</button>}
                      </td>
                    </tr>
                  ))}
                </tbody>
                <tfoot className="border-t-2 border-slate-200 bg-slate-50">
                  <tr>
                    <td colSpan={2} className="px-5 py-3 font-semibold text-slate-700">Jami ({year})</td>
                    <td className="px-5 py-3 text-right font-bold text-indigo-600">{fmt(salary.filter(s=>s.year===year).reduce((a,s)=>a+(s.total_amount||0),0))} som</td>
                    <td colSpan={2}></td>
                  </tr>
                </tfoot>
              </table>
            </div>
          )}
        </div>
      )}

      {tab === 'evaluations' && (
        <div className="space-y-4">
          {evalAvg && evalAvg.total > 0 && (
            <div className="card flex items-center gap-5">
              <div className="text-center">
                <p className="text-5xl font-bold text-yellow-400">{Number(evalAvg.avg_rating || 0).toFixed(1)}</p>
                <div className="text-yellow-400 text-xl mt-1">{'★'.repeat(Math.round(evalAvg.avg_rating||0))}{'☆'.repeat(5-Math.round(evalAvg.avg_rating||0))}</div>
                <p className="text-slate-500 text-xs mt-1">Ortacha baho</p>
              </div>
              <div className="flex-1 space-y-2">
                <div className="flex justify-between text-sm"><span className="text-slate-500">Jami</span><span className="font-medium">{evalAvg.total}</span></div>
                <div className="flex justify-between text-sm"><span className="text-slate-500">5 yulduz</span><span className="font-medium text-yellow-500">{evalAvg.five_star}</span></div>
              </div>
            </div>
          )}
          {evaluations.length === 0 ? (
            <div className="card text-center py-10 text-slate-400">Hali baholanmagan</div>
          ) : (
            <div className="space-y-3">
              {evaluations.map(ev => (
                <div key={ev.id} className="card py-3">
                  <div className="flex items-center gap-2 mb-1">
                    <span className="text-yellow-400">{'★'.repeat(ev.rating)}{'☆'.repeat(5-ev.rating)}</span>
                    <span className="text-xs text-slate-500 bg-slate-100 px-2 py-0.5 rounded-full">{ev.category}</span>
                  </div>
                  {ev.comment && <p className="text-sm text-slate-600">{ev.comment}</p>}
                  <p className="text-xs text-slate-400 mt-1">{MONTHS[ev.month]} {ev.year}</p>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* Telegram tugmasi */}
      <a href="https://t.me/Robiya_khurshidovna" target="_blank" rel="noreferrer"
        style={{ position: 'fixed', bottom: '24px', right: '24px', zIndex: 9999 }}
        className="group block">
        <div className="relative w-14 h-14">
          <span className="absolute inset-0 rounded-full bg-sky-400 animate-ping opacity-60"></span>
          <div className="relative w-14 h-14 rounded-full bg-gradient-to-br from-sky-400 to-blue-500 shadow-xl flex items-center justify-center hover:scale-110 transition-transform duration-200">
            <svg viewBox="0 0 24 24" className="w-7 h-7 fill-white">
              <path d="M12 0C5.373 0 0 5.373 0 12s5.373 12 12 12 12-5.373 12-12S18.627 0 12 0zm5.894 8.221-1.97 9.28c-.145.658-.537.818-1.084.508l-3-2.21-1.447 1.394c-.16.16-.295.295-.605.295l.213-3.053 5.56-5.023c.242-.213-.054-.333-.373-.12L8.32 14.26l-2.96-.924c-.643-.204-.657-.643.136-.953l11.57-4.461c.537-.194 1.006.131.828.299z"/>
            </svg>
          </div>
          <span className="absolute right-16 top-1/2 -translate-y-1/2 bg-slate-800 text-white text-xs px-3 py-1.5 rounded-lg whitespace-nowrap opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none">
            Admin bilan boglanish
          </span>
        </div>
      </a>

    </div>
  );
}
