'use client';
import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import BottomNav from '@/components/BottomNav';

export default function SchemesPage() {
  const router = useRouter();
  const [schemes, setSchemes] = useState([]);
  const [investAmounts, setInvestAmounts] = useState({});
  const [mode, setMode] = useState('individual');
  const [toast, setToast] = useState('');

  useEffect(() => {
    Promise.all([
      fetch('/api/schemes').then(r => r.json()),
      fetch('/api/auth/me').then(r => r.json())
    ]).then(([s, u]) => {
      if (u.error) { router.replace('/login'); return; }
      setSchemes(s.schemes || []);
      setMode(u.user.mode);
      const amts = {};
      (s.schemes || []).forEach(sc => { if (sc.invest_amount) amts[sc.id] = sc.invest_amount; });
      setInvestAmounts(amts);
    });
  }, []);

  async function markInterest(schemeId, interested) {
    const amt = interested ? (investAmounts[schemeId] || 0) : 0;
    await fetch('/api/schemes', {
      method: 'POST', headers: {'Content-Type':'application/json'},
      body: JSON.stringify({ scheme_id: schemeId, interested, invest_amount: Number(amt) })
    });
    setSchemes(prev => prev.map(s => s.id === schemeId ? { ...s, interested: interested ? 1 : 0, invest_amount: amt } : s));
    if (interested && amt > 0) {
      setToast('✅ Investment added! Dashboard updated.');
      setTimeout(() => setToast(''), 2500);
    }
  }

  async function submitAmount(schemeId) {
    const amt = Number(investAmounts[schemeId] || 0);
    if (amt <= 0) return;
    await markInterest(schemeId, true);
  }

  if (!schemes.length) return <div style={{minHeight:'100vh',display:'flex',alignItems:'center',justifyContent:'center'}}><div className="spinner"></div></div>;

  return (
    <div className={mode === 'couple' ? 'couple-mode inner-page' : 'inner-page'}>
      <div className="is-header ish-schemes">
        <Link href="/dashboard" className="is-back">← Back</Link>
        <div className="is-title">🏛️ Government Schemes</div>
        <div className="is-sub">Save tax · Earn guaranteed returns</div>
      </div>
      <div className="scroller"><div className="is-body">
        {schemes.map(s => (
          <div key={s.id} className={`scheme-card ${s.interested ? 'interested' : ''}`}>
            <div className="scheme-header">
              <div className="scheme-ico">{s.icon}</div>
              <div>
                <div className="scheme-name">{s.name}</div>
                <div className="scheme-rate">Returns: {s.rate}</div>
              </div>
            </div>
            <div className="scheme-desc">{s.desc}</div>
            <div className="scheme-meta">
              <span className="scheme-tag">🔒 Lock-in: {s.lock}</span>
              <span className="scheme-tag">Min: ₹{s.min}</span>
              {s.max && <span className="scheme-tag">Max: ₹{s.max?.toLocaleString('en-IN')}</span>}
            </div>
            <div className="scheme-actions">
              <button className={`scheme-btn interested-btn ${s.interested ? 'active' : ''}`} onClick={() => markInterest(s.id, true)}>
                ✓ Interested
              </button>
              <button className={`scheme-btn not-interested-btn ${!s.interested ? '' : ''}`} onClick={() => markInterest(s.id, false)}>
                ✗ Not Interested
              </button>
            </div>
            {s.interested ? (
              <div className="scheme-invest-row">
                <input className="finput" type="number" placeholder="Amount to invest (₹)" value={investAmounts[s.id] || ''} onChange={e => setInvestAmounts(p => ({ ...p, [s.id]: e.target.value }))} />
                <button className="submit-btn" onClick={() => submitAmount(s.id)}>Submit</button>
              </div>
            ) : null}
            <a href={s.url} target="_blank" rel="noopener noreferrer" className="scheme-link">
              🔗 Official Website →
            </a>
          </div>
        ))}
      </div></div>
      {toast && <div className="save-toast">{toast}</div>}
      <BottomNav />
    </div>
  );
}
