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
      navigate('/login', { replace: true });
    }, 5200);
    return () => { clearTimeout(t1); clearTimeout(t2); clearTimeout(t3); };
  }, []);

  return (
    <div className={`fixed inset-0 flex flex-col items-center justify-center bg-[radial-gradient(circle_at_top_left,_rgba(34,211,238,0.25),_transparent_35%),linear-gradient(135deg,_#0f172a_0%,_#0f2f4a_45%,_#1d4ed8_100%)] transition-opacity duration-700 ${fadeOut ? 'opacity-0' : 'opacity-100'}`}>
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className="absolute -top-28 -left-24 h-72 w-72 rounded-full bg-cyan-400/20 blur-3xl animate-pulse" />
        <div className="absolute -bottom-32 -right-24 h-80 w-80 rounded-full bg-blue-500/20 blur-3xl animate-pulse" style={{ animationDelay: '1s' }} />
      </div>

      <div className="relative flex flex-col items-center gap-8">
        <div className="relative flex items-center justify-center" style={{ width: 170, height: 170 }}>
          {spinning && (
            <div className="absolute inset-0 rounded-full border-4 border-transparent border-t-cyan-300 border-r-cyan-200/60"
              style={{ animation: 'spinFast 0.4s linear infinite' }} />
          )}
          {spinning && (
            <div className="absolute rounded-full border-4 border-transparent border-b-blue-300 border-l-blue-300/60"
              style={{ width: 128, height: 128, animation: 'spinReverse 0.6s linear infinite' }} />
          )}
          <div className="z-10 flex h-24 w-24 items-center justify-center rounded-[24px] border border-white/20 bg-white/10 shadow-2xl backdrop-blur-lg">
            <svg xmlns="http://www.w3.org/2000/svg" className="h-12 w-12 text-white drop-shadow-lg" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" />
            </svg>
          </div>
        </div>

        <div className="text-center">
          <h1 className="text-5xl font-semibold tracking-tight text-white">Kiro</h1>
          <p className="mt-2 text-sm uppercase tracking-[0.35em] text-cyan-100/70">Boshqaruv tizimi</p>
        </div>

        <div className="flex h-8 items-center justify-center">
          {spinning ? (
            <div className="flex gap-2">
              {[0,1,2].map(i => (
                <div key={i} className="h-2.5 w-2.5 rounded-full bg-white/70 animate-bounce"
                  style={{ animationDelay: `${i * 0.12}s` }} />
              ))}
            </div>
          ) : (
            <div className="flex items-center gap-2 text-sm text-cyan-100/80">
              <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 text-emerald-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M5 13l4 4L19 7" />
              </svg>
              Tayyor
            </div>
          )}
        </div>
      </div>

      <p className="absolute bottom-8 text-xs uppercase tracking-[0.35em] text-white/20">KIRO © 2026</p>

      <style>{`
        @keyframes spinFast { from { transform: rotate(0deg); } to { transform: rotate(360deg); } }
        @keyframes spinReverse { from { transform: rotate(0deg); } to { transform: rotate(-360deg); } }
      `}</style>
    </div>
  );
}
