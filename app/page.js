'use client';
import { useRouter } from 'next/navigation';
import { useEffect, useState } from 'react';

export default function Landing() {
  const router = useRouter();
  const [checking, setChecking] = useState(true);

  useEffect(() => {
    fetch('/api/auth/me').then(r => r.json()).then(d => {
      if (d.user) router.replace('/dashboard');
      else setChecking(false);
    }).catch(() => setChecking(false));
  }, []);

  if (checking) return <div style={{minHeight:'100vh',display:'flex',alignItems:'center',justifyContent:'center',background:'#0D1117'}}><div className="spinner"></div></div>;

  return (
    <div className="landing-page">
      <div className="land-orb">
        <div className="land-orb-inner">
          <div className="orb-score">68</div>
          <div className="orb-label">HEALTH</div>
        </div>
      </div>
      <div className="land-logo">Fin<span>Mate</span></div>
      <div className="land-tagline">Your personal finance mentor · India 🇮🇳</div>
      <div className="land-features">
        <span className="lf-pill">🔥 FIRE Planner</span>
        <span className="lf-pill">📊 Portfolio X-Ray</span>
        <span className="lf-pill">💰 Tax Wizard</span>
        <span className="lf-pill">💬 AI Advisor</span>
        <span className="lf-pill">💕 Couple Mode</span>
        <span className="lf-pill">🏛️ Govt. Schemes</span>
      </div>
      <button className="land-cta" onClick={() => router.push('/signup')}>Get Started →</button>
      <div className="land-login">Already have an account? <b onClick={() => router.push('/login')}>Login</b></div>
    </div>
  );
}
