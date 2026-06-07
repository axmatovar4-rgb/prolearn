import { useEffect, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import api from '../api';
import toast from 'react-hot-toast';
import { HiArrowLeft, HiCamera } from 'react-icons/hi';

const DEPARTMENTS = ['Sotuv', 'Moliya', 'IT', 'HR', 'Marketing', 'Logistika', 'Ishlab chiqarish', 'Boshqaruv'];

export default function EmployeeForm() {
  const { id } = useParams();
  const navigate = useNavigate();
  const isEdit = Boolean(id);

  const [form, setForm] = useState({
    first_name: '', last_name: '', middle_name: '',
    phone: '', email: '', address: '', city: '',
    position: '', department: '', hire_date: '',
    salary_type: 'monthly', base_salary: '', status: 'active'
  });
  const [photo, setPhoto] = useState(null);
  const [preview, setPreview] = useState(null);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (isEdit) {
      api.get(`/employees/${id}`).then(r => {
        setForm(r.data);
        if (r.data.photo) setPreview(r.data.photo);
      });
    }
  }, [id]);

  const handlePhoto = (e) => {
    const file = e.target.files[0];
    if (file) {
      setPhoto(file);
      setPreview(URL.createObjectURL(file));
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    try {
      const fd = new FormData();
      Object.entries(form).forEach(([k, v]) => fd.append(k, v || ''));
      if (photo) fd.append('photo', photo);

      if (isEdit) {
        await api.put(`/employees/${id}`, fd);
        toast.success('Yangilandi');
      } else {
        await api.post('/employees', fd);
        toast.success('Ishchi qo\'shildi');
      }
      navigate('/employees');
    } catch (err) {
      toast.error(err.response?.data?.error || 'Xatolik');
    } finally {
      setLoading(false);
    }
  };

  const set = (k, v) => setForm(f => ({ ...f, [k]: v }));

  return (
    <div className="p-6 max-w-3xl">
      <div className="flex items-center gap-3 mb-6">
        <button onClick={() => navigate(-1)} className="p-2 hover:bg-slate-200 rounded-lg transition-colors">
          <HiArrowLeft className="text-slate-600" />
        </button>
        <div>
          <h1 className="text-2xl font-bold text-slate-800">{isEdit ? 'Ishchini tahrirlash' : 'Yangi ishchi'}</h1>
        </div>
      </div>

      <form onSubmit={handleSubmit} className="space-y-5">
        {/* Foto */}
        <div className="card">
          <h2 className="font-semibold text-slate-700 mb-4">Foto</h2>
          <div className="flex items-center gap-5">
            <div className="relative">
              <div className="w-20 h-20 rounded-full bg-slate-100 overflow-hidden flex items-center justify-center">
                {preview ? (
                  <img src={preview} alt="" className="w-full h-full object-cover" />
                ) : (
                  <HiCamera className="text-slate-400 text-3xl" />
                )}
              </div>
              <label className="absolute bottom-0 right-0 bg-blue-600 text-white p-1 rounded-full cursor-pointer hover:bg-blue-700 transition-colors">
                <HiCamera className="text-xs" />
                <input type="file" accept="image/*" onChange={handlePhoto} className="hidden" />
              </label>
            </div>
            <div className="text-sm text-slate-500">
              <p>JPG, PNG formatlar qabul qilinadi</p>
              <p>Maksimal 2MB</p>
            </div>
          </div>
        </div>

        {/* Shaxsiy ma'lumotlar */}
        <div className="card">
          <h2 className="font-semibold text-slate-700 mb-4">Shaxsiy ma'lumotlar</h2>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="label">Familiya *</label>
              <input className="input" value={form.last_name} onChange={e => set('last_name', e.target.value)} required />
            </div>
            <div>
              <label className="label">Ismi *</label>
              <input className="input" value={form.first_name} onChange={e => set('first_name', e.target.value)} required />
            </div>
            <div>
              <label className="label">Otasining ismi</label>
              <input className="input" value={form.middle_name} onChange={e => set('middle_name', e.target.value)} />
            </div>
            <div>
              <label className="label">Telefon</label>
              <input className="input" placeholder="+998901234567" value={form.phone} onChange={e => set('phone', e.target.value)} />
            </div>
            <div>
              <label className="label">Email</label>
              <input type="email" className="input" value={form.email} onChange={e => set('email', e.target.value)} />
            </div>
            <div>
              <label className="label">Shahar</label>
              <input className="input" value={form.city} onChange={e => set('city', e.target.value)} />
            </div>
            <div className="sm:col-span-2">
              <label className="label">Manzil</label>
              <input className="input" placeholder="Ko'cha, uy raqami" value={form.address} onChange={e => set('address', e.target.value)} />
            </div>
          </div>
        </div>

        {/* Ish ma'lumotlari */}
        <div className="card">
          <h2 className="font-semibold text-slate-700 mb-4">Ish ma'lumotlari</h2>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="label">Lavozim</label>
              <input className="input" value={form.position} onChange={e => set('position', e.target.value)} />
            </div>
            <div>
              <label className="label">Bo'lim</label>
              <select className="input" value={form.department} onChange={e => set('department', e.target.value)}>
                <option value="">Tanlang...</option>
                {DEPARTMENTS.map(d => <option key={d} value={d}>{d}</option>)}
              </select>
            </div>
            <div>
              <label className="label">Ish boshlagan sana</label>
              <input type="date" className="input" value={form.hire_date} onChange={e => set('hire_date', e.target.value)} />
            </div>
            <div>
              <label className="label">Holat</label>
              <select className="input" value={form.status} onChange={e => set('status', e.target.value)}>
                <option value="active">Faol</option>
                <option value="inactive">Nofaol</option>
              </select>
            </div>
          </div>
        </div>

        {/* Maosh */}
        <div className="card">
          <h2 className="font-semibold text-slate-700 mb-4">Maosh</h2>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="label">Maosh turi</label>
              <select className="input" value={form.salary_type} onChange={e => set('salary_type', e.target.value)}>
                <option value="monthly">Oylik (belgilangan)</option>
                <option value="hourly">Soatbay</option>
              </select>
            </div>
            <div>
              <label className="label">
                {form.salary_type === 'monthly' ? 'Oylik maosh (so\'m)' : 'Soatlik tarif (so\'m)'}
              </label>
              <input
                type="number"
                className="input"
                min="0"
                value={form.base_salary}
                onChange={e => set('base_salary', e.target.value)}
              />
            </div>
          </div>
        </div>

        <div className="flex gap-3">
          <button type="submit" disabled={loading} className="btn-primary">
            {loading ? 'Saqlanmoqda...' : (isEdit ? 'Saqlash' : 'Qo\'shish')}
          </button>
          <button type="button" onClick={() => navigate(-1)} className="btn-secondary">Bekor qilish</button>
        </div>
      </form>
    </div>
  );
}
