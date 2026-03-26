'use client';
import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import BottomNav from '@/components/BottomNav';

function fmt(n) {
  if (!n || n === 0) return '₹0';
  if (n >= 10000000) return '₹' + (n/10000000).toFixed(1) + ' Cr';
  if (n >= 100000) return '₹' + (n/100000).toFixed(1) + 'L';
  if (n >= 1000) return '₹' + (n/1000).toFixed(0) + 'K';
  return '₹' + Math.round(n);
}

export default function FirePage() {
  const router = useRouter();
  const [fire, setFire] = useState(null);
  const [mode, setMode] = useState('individual');

  useEffect(() => {
    Promise.all([
      fetch('/api/fire', { method: 'POST', headers: {'Content-Type':'application/json'}, body: '{}' }).then(r => r.json()),
      fetch('/api/auth/me').then(r => r.json())
    ]).then(([f, u]) => {
      if (u.error) { router.replace('/login'); return; }
      setFire(f);
      setMode(u.user.mode);
    });
  }, []);

  if (!fire) return <div style={{minHeight:'100vh',display:'flex',alignItems:'center',justifyContent:'center'}}><div className="spinner"></div></div>;

  return (
    <div className={mode === 'couple' ? 'couple-mode inner-page' : 'inner-page'}>
      <div className="is-header ish-fire">
        <Link href="/dashboard" className="is-back">← Back</Link>
        <div className="is-title">🔥 FIRE Roadmap</div>
        <div className="is-sub">Financial Independence · Retire Early{fire.isCouple ? ' · Joint' : ''}</div>
      </div>
      <div className="scroller"><div className="is-body">
        <div className="fire-big">
          <div className="fb-lbl">You can retire at</div>
          <div className="fb-age">{fire.retireAge} 🎯</div>
          <div className="fb-sub">Target Year {fire.retireYear} · {fire.yearsToGo} years to go</div>
        </div>
        <div className="stat-grid">
          <div className="stat-card"><div className="stat-ico">💰</div><div className="stat-lbl">Corpus</div><div className="stat-val">{fmt(fire.corpus)}</div></div>
          <div className="stat-card"><div className="stat-ico">📅</div><div className="stat-lbl">Monthly SIP</div><div className="stat-val">{fmt(fire.sipNeeded)}</div></div>
          <div className="stat-card"><div className="stat-ico">📈</div><div className="stat-lbl">Exp. XIRR</div><div className="stat-val">{fire.xirr}%</div></div>
          <div className="stat-card"><div className="stat-ico">🏦</div><div className="stat-lbl">Current NW</div><div className="stat-val">{fmt(fire.currentNetWorth)}</div></div>
        </div>
        <div className="alloc-card">
          <div className="alloc-title">Suggested Allocation</div>
          <div className="alloc-bar">
            <div className="alloc-seg" style={{width:fire.allocation.equity+'%', background:'linear-gradient(90deg,#4F46E5,#7C3AED)'}}></div>
            <div className="alloc-seg" style={{width:fire.allocation.debt+'%', background:'#10B981'}}></div>
            <div className="alloc-seg" style={{width:fire.allocation.gold+'%', background:'#F59E0B'}}></div>
          </div>
          <div className="alloc-leg">
            <div className="al-item"><div className="al-dot" style={{background:'#4F46E5'}}></div>Equity {fire.allocation.equity}%</div>
            <div className="al-item"><div className="al-dot" style={{background:'#10B981'}}></div>Debt {fire.allocation.debt}%</div>
            <div className="al-item"><div className="al-dot" style={{background:'#F59E0B'}}></div>Gold {fire.allocation.gold}%</div>
          </div>
        </div>
        <div className="milestone-card">
          <div className="mc-title">📅 Milestone Roadmap</div>
          {fire.milestones.map((m, i) => (
            <div className="mc-row" key={i}>
              <div className="mc-yr"><span>YR</span><b>{m.year}</b></div>
              <div className="mc-info"><div className="mc-nw">{fmt(m.netWorth)} {i === fire.milestones.length-1 ? '🎉' : ''}</div><div className="mc-desc">{m.description}</div></div>
            </div>
          ))}
        </div>
        <div style={{height:14}}></div>
        <Link href="/chat?q=Adjust+my+FIRE+plan" className="action-btn" style={{display:'block',textAlign:'center'}}>💬 Adjust Plan with AI</Link>
      </div></div>
      <BottomNav />
    </div>
  );
}
