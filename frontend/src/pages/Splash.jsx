import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';

export default function Splash() {
  const navigate = useNavigate();
  const [spinning, setSpinning] = useState(true);
  const [fadeOut, setFadeOut] = useState(false);

  useEffect(() => {
    const t1 = setTimeout(() => setSpinning(false), 4200);
    const t2 = setTimeout(() => setFadeOut(true), 4500);
    const t3 = setTimeout(() => {
      // Har doim logindan o'tkazamiz
      navigate('/login', { replace: true });
    }, 5200);
    return () => { clearTimeout(t1); clearTimeout(t2); clearTimeout(t3); };
  }, []);

  return (
    <div className={`fixed inset-0 flex flex-col items-center justify-center
      bg-gradient-to-br from-indigo-900 via-purple-900 to-slate-900
      transition-opacity duration-700 ${fadeOut ? 'opacity-0' : 'opacity-100'}`}>

      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className="absolute -top-32 -left-32 w-96 h-96 bg-indigo-500/20 rounded-full blur-3xl animate-pulse" />
        <div className="absolute -bottom-32 -right-32 w-96 h-96 bg-purple-500/20 rounded-full blur-3xl animate-pulse" style={{ animationDelay: '1s' }} />
      </div>

      <div className="relative flex flex-col items-center gap-8">
        <div className="relative flex items-center justify-center" style={{ width: 160, height: 160 }}>
          {spinning && (
            <div className="absolute inset-0 rounded-full border-4 border-transparent border-t-white border-r-white/50"
              style={{ animation: 'spinFast 0.4s linear infinite' }} />
          )}
          {spinning && (
            <div className="absolute rounded-full border-4 border-transparent border-b-purple-400 border-l-purple-400/50"
              style={{ width: 120, height: 120, animation: 'spinReverse 0.6s linear infinite' }} />
          )}
          <div className="w-24 h-24 rounded-2xl flex items-center justify-center shadow-2xl z-10"
            style={{
              background: 'linear-gradient(135deg, rgba(255,255,255,0.25), rgba(255,255,255,0.08))',
              backdropFilter: 'blur(10px)',
              border: '1px solid rgba(255,255,255,0.2)',
            }}>
            <svg xmlns="http://www.w3.org/2000/svg" className="w-12 h-12 text-white drop-shadow-lg" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" />
            </svg>
          </div>
        </div>

        <div className="text-center">
          <h1 className="text-5xl font-bold text-white tracking-tight">ProLearn</h1>
          <p className="text-white/50 text-sm mt-2 tracking-widest uppercase">Boshqaruv tizimi</p>
        </div>

        <div className="h-8 flex items-center justify-center">
          {spinning ? (
            <div className="flex gap-2">
              {[0,1,2].map(i => (
                <div key={i} className="w-2 h-2 bg-white/60 rounded-full animate-bounce"
                  style={{ animationDelay: `${i * 0.12}s` }} />
              ))}
            </div>
          ) : (
            <div className="flex items-center gap-2 text-white/70 text-sm">
              <svg xmlns="http://www.w3.org/2000/svg" className="w-5 h-5 text-green-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M5 13l4 4L19 7" />
              </svg>
              Tayyor
            </div>
          )}
        </div>
      </div>

      <p className="absolute bottom-8 text-white/20 text-xs tracking-widest">PROLEARN © 2024</p>

      <style>{`
        @keyframes spinFast { from { transform: rotate(0deg); } to { transform: rotate(360deg); } }
        @keyframes spinReverse { from { transform: rotate(0deg); } to { transform: rotate(-360deg); } }
      `}</style>
    </div>
  );
}
