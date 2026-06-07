import { useEffect, useState, useRef } from 'react';
import api from '../api';
import toast from 'react-hot-toast';

const DOC_TYPES = ['Pasport', 'Diplom', 'Mehnat daftarchasi', 'Shartnoma', 'Tibbiy ko\'rik', 'Boshqa'];

export default function Recruitment() {
  const [employees, setEmployees] = useState([]);
  const [selEmp, setSelEmp] = useState('');
  const [docs, setDocs] = useState([]);
  const [probations, setProbations] = useState([]);
  const [expiring, setExpiring] = useState([]);
  const [tab, setTab] = useState('docs');
  const [showDocForm, setShowDocForm] = useState(false);
  const [showProbForm, setShowProbForm] = useState(false);
  const [docForm, setDocForm] = useState({ type: 'Pasport', name: '', expiry_date: '', note: '' });
  const [probForm, setProbForm] = useState({ employee_id: '', start_date: '', end_date: '', note: '' });
  const fileRef = useRef();
  const [file, setFile] = useState(null);

  useEffect(() => {
    api.get('/employees').then(r => setEmployees(r.data));
    api.get('/recruitment/expiring-docs').then(r => setExpiring(r.data));
  }, []);

  useEffect(() => {
    if (!selEmp) return;
    api.get(`/recruitment/docs/${selEmp}`).then(r => setDocs(r.data));
    api.get(`/recruitment/probation/${selEmp}`).then(r => setProbations(r.data));
  }, [selEmp]);

  const addDoc = async (e) => {
    e.preventDefault();
    try {
      const fd = new FormData();
      Object.entries(docForm).forEach(([k, v]) => fd.append(k, v));
      if (file) fd.append('file', file);
      await api.post(`/recruitment/docs/${selEmp}`, fd);
      toast.success('Hujjat qo\'shildi');
      setShowDocForm(false);
      setFile(null);
      api.get(`/recruitment/docs/${selEmp}`).then(r => setDocs(r.data));
    } catch { toast.error('Xatolik'); }
  };

  const deleteDoc = async (id) => {
    if (!confirm('O\'chirishni tasdiqlaysizmi?')) return;
    await api.delete(`/recruitment/docs/${id}`);
    toast.success("O'chirildi");
    api.get(`/recruitment/docs/${selEmp}`).then(r => setDocs(r.data));
  };

  const addProbation = async (e) => {
    e.preventDefault();
    try {
      await api.post('/recruitment/probation', { ...probForm, employee_id: selEmp });
      toast.success('Sinov muddati qo\'shildi');
      setShowProbForm(false);
      api.get(`/recruitment/probation/${selEmp}`).then(r => setProbations(r.data));
    } catch { toast.error('Xatolik'); }
  };

  const completeProbation = async (id, result) => {
    await api.patch(`/recruitment/probation/${id}`, { status: 'completed', result });
    toast.success('Yangilandi');
    api.get(`/recruitment/probation/${selEmp}`).then(r => setProbations(r.data));
  };

  const selName = employees.find(e => String(e.id) === String(selEmp));

  return (
    <div className="p-6 space-y-5">
      <div>
        <h1 className="text-2xl font-bold text-slate-800 dark:text-white">Ishga qabul va hujjatlar</h1>
        <p className="text-slate-500 text-sm">Xodim hujjatlari, sinov muddati</p>
      </div>

      {/* Muddati tugayotgan hujjatlar */}
      {expiring.length > 0 && (
        <div className="bg-amber-50 border border-amber-200 rounded-xl p-4">
          <h3 className="font-semibold text-amber-700 mb-2">⚠️ 30 kunda muddati tugaydigan hujjatlar</h3>
          <div className="space-y-1">
            {expiring.map(d => (
              <div key={d.id} className="flex items-center justify-between text-sm">
                <span className="text-slate-700">{d.last_name} {d.first_name} — {d.name}</span>
                <span className="text-amber-600 font-medium">{d.expiry_date}</span>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Xodim tanlash */}
      <div className="card flex items-center gap-3">
        <select className="input flex-1" value={selEmp} onChange={e => setSelEmp(e.target.value)}>
          <option value="">Xodimni tanlang...</option>
          {employees.map(e => <option key={e.id} value={e.id}>{e.last_name} {e.first_name} — {e.position}</option>)}
        </select>
      </div>

      {selEmp && (
        <>
          {/* Tablar */}
          <div className="flex gap-2 border-b border-slate-200 dark:border-slate-700">
            {[['docs', '📄 Hujjatlar'], ['probation', '⏱️ Sinov muddati']].map(([v, l]) => (
              <button key={v} onClick={() => setTab(v)}
                className={`px-4 py-2 text-sm font-medium border-b-2 transition-colors ${tab === v ? 'border-indigo-500 text-indigo-600' : 'border-transparent text-slate-500 hover:text-slate-700'}`}>
                {l}
              </button>
            ))}
          </div>

          {/* Hujjatlar */}
          {tab === 'docs' && (
            <div className="space-y-4">
              <div className="flex justify-between items-center">
                <h3 className="font-semibold text-slate-700 dark:text-white">{selName?.last_name} {selName?.first_name} — Hujjatlar</h3>
                <button onClick={() => setShowDocForm(!showDocForm)} className="btn-primary text-sm">+ Hujjat qo'shish</button>
              </div>

              {showDocForm && (
                <form onSubmit={addDoc} className="card border-2 border-indigo-100 space-y-3">
                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <label className="label">Hujjat turi</label>
                      <select className="input" value={docForm.type} onChange={e => setDocForm(f => ({...f, type: e.target.value}))}>
                        {DOC_TYPES.map(t => <option key={t}>{t}</option>)}
                      </select>
                    </div>
                    <div>
                      <label className="label">Nomi</label>
                      <input className="input" value={docForm.name} onChange={e => setDocForm(f => ({...f, name: e.target.value}))} required />
                    </div>
                    <div>
                      <label className="label">Muddati tugash sanasi</label>
                      <input type="date" className="input" value={docForm.expiry_date} onChange={e => setDocForm(f => ({...f, expiry_date: e.target.value}))} />
                    </div>
                    <div>
                      <label className="label">Fayl yuklash</label>
                      <input ref={fileRef} type="file" className="input text-sm" accept=".pdf,.jpg,.jpeg,.png,.doc,.docx" onChange={e => setFile(e.target.files[0])} />
                    </div>
                    <div className="col-span-2">
                      <label className="label">Izoh</label>
                      <input className="input" value={docForm.note} onChange={e => setDocForm(f => ({...f, note: e.target.value}))} />
                    </div>
                  </div>
                  <div className="flex gap-2">
                    <button type="submit" className="btn-primary text-sm">Saqlash</button>
                    <button type="button" onClick={() => setShowDocForm(false)} className="btn-secondary text-sm">Bekor</button>
                  </div>
                </form>
              )}

              <div className="space-y-2">
                {docs.length === 0 ? (
                  <div className="card text-center py-8 text-slate-400">Hujjatlar yo'q</div>
                ) : docs.map(d => (
                  <div key={d.id} className="card flex items-center justify-between gap-3 py-3">
                    <div className="flex items-center gap-3">
                      <div className="bg-indigo-100 p-2 rounded-lg text-xl">📄</div>
                      <div>
                        <p className="font-medium text-slate-800 dark:text-white">{d.name}</p>
                        <p className="text-xs text-slate-500">{d.type} {d.expiry_date && `· Muddati: ${d.expiry_date}`}</p>
                        {d.note && <p className="text-xs text-slate-400">{d.note}</p>}
                      </div>
                    </div>
                    <div className="flex gap-2">
                      {d.file_path && (
                        <a href={d.file_path} target="_blank" rel="noreferrer"
                          className="px-3 py-1.5 bg-blue-50 text-blue-600 rounded-lg text-xs hover:bg-blue-100 transition-colors">
                          📥 Yuklab olish
                        </a>
                      )}
                      <button onClick={() => deleteDoc(d.id)}
                        className="px-3 py-1.5 bg-red-50 text-red-500 rounded-lg text-xs hover:bg-red-100 transition-colors">
                        O'chirish
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Sinov muddati */}
          {tab === 'probation' && (
            <div className="space-y-4">
              <div className="flex justify-between items-center">
                <h3 className="font-semibold text-slate-700 dark:text-white">Sinov muddati</h3>
                <button onClick={() => setShowProbForm(!showProbForm)} className="btn-primary text-sm">+ Qo'shish</button>
              </div>

              {showProbForm && (
                <form onSubmit={addProbation} className="card border-2 border-indigo-100 space-y-3">
                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <label className="label">Boshlanish</label>
                      <input type="date" className="input" value={probForm.start_date} onChange={e => setProbForm(f => ({...f, start_date: e.target.value}))} required />
                    </div>
                    <div>
                      <label className="label">Tugash</label>
                      <input type="date" className="input" value={probForm.end_date} onChange={e => setProbForm(f => ({...f, end_date: e.target.value}))} required />
                    </div>
                    <div className="col-span-2">
                      <label className="label">Izoh</label>
                      <input className="input" value={probForm.note} onChange={e => setProbForm(f => ({...f, note: e.target.value}))} />
                    </div>
                  </div>
                  <div className="flex gap-2">
                    <button type="submit" className="btn-primary text-sm">Saqlash</button>
                    <button type="button" onClick={() => setShowProbForm(false)} className="btn-secondary text-sm">Bekor</button>
                  </div>
                </form>
              )}

              <div className="space-y-2">
                {probations.length === 0 ? (
                  <div className="card text-center py-8 text-slate-400">Sinov muddati yo'q</div>
                ) : probations.map(p => (
                  <div key={p.id} className="card py-3">
                    <div className="flex items-center justify-between">
                      <div>
                        <div className="flex items-center gap-2">
                          <span className={`px-2 py-0.5 rounded-full text-xs font-medium ${p.status === 'active' ? 'bg-blue-100 text-blue-700' : p.result === 'passed' ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-600'}`}>
                            {p.status === 'active' ? '⏱ Davom etmoqda' : p.result === 'passed' ? '✓ O\'tdi' : '✗ O\'tmadi'}
                          </span>
                        </div>
                        <p className="text-sm text-slate-600 mt-1">{p.start_date} → {p.end_date}</p>
                        {p.note && <p className="text-xs text-slate-400">{p.note}</p>}
                      </div>
                      {p.status === 'active' && (
                        <div className="flex gap-2">
                          <button onClick={() => completeProbation(p.id, 'passed')} className="px-3 py-1.5 bg-green-50 text-green-600 rounded-lg text-xs hover:bg-green-100">✓ O'tdi</button>
                          <button onClick={() => completeProbation(p.id, 'failed')} className="px-3 py-1.5 bg-red-50 text-red-500 rounded-lg text-xs hover:bg-red-100">✗ O'tmadi</button>
                        </div>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </>
      )}
    </div>
  );
}
