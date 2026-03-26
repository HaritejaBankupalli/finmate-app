'use client';
import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import BottomNav from '@/components/BottomNav';

function fmt(n) {
  if (!n || n === 0) return '₹0';
  if (n >= 100000) return '₹' + (n/100000).toFixed(1) + 'L';
  if (n >= 1000) return '₹' + (n/1000).toFixed(0) + 'K';
  return '₹' + Math.round(n);
}

export default function PortfolioPage() {
  const router = useRouter();
  const [data, setData] = useState(null);
  const [mode, setMode] = useState('individual');

  useEffect(() => {
    Promise.all([
      fetch('/api/portfolio').then(r => r.json()),
      fetch('/api/auth/me').then(r => r.json())
    ]).then(([p, u]) => {
      if (u.error) { router.replace('/login'); return; }
      setData(p);
      setMode(u.user.mode);
    });
  }, []);

  if (!data) return <div style={{minHeight:'100vh',display:'flex',alignItems:'center',justifyContent:'center'}}><div className="spinner"></div></div>;

  return (
    <div className={mode === 'couple' ? 'couple-mode inner-page' : 'inner-page'}>
      <div className="is-header ish-port">
        <Link href="/dashboard" className="is-back">← Back</Link>
        <div className="is-title">📂 Portfolio X-Ray</div>
        <div className="is-sub">Analyse overlaps · costs · returns</div>
      </div>
      <div className="scroller"><div className="is-body">
        <div className="xray-big">
          <div className="xb-ring"><div className="xb-n">{data.score}</div><div className="xb-d">/100</div></div>
          <div>
            <div className="xb-title">Portfolio Health</div>
            <div className="xb-sub">XIRR {data.xirr}% · {data.fundCount} funds · {fmt(data.totalInvested)}</div>
          </div>
        </div>
        <div className="stat-grid">
          <div className="stat-card"><div className="stat-ico">📊</div><div className="stat-lbl">XIRR</div><div className="stat-val">{data.xirr}%</div></div>
          <div className="stat-card"><div className="stat-ico">💼</div><div className="stat-lbl">Total Funds</div><div className="stat-val">{data.fundCount}</div></div>
          <div className="stat-card"><div className="stat-ico">⚠️</div><div className="stat-lbl">Overlap</div><div className="stat-val" style={{color:data.overlap>20?'#EF4444':'#10B981'}}>{data.overlap}%</div></div>
          <div className="stat-card"><div className="stat-ico">💸</div><div className="stat-lbl">Avg. Expense</div><div className="stat-val" style={{color:parseFloat(data.expenseRatio)>1.5?'#EF4444':'#10B981'}}>{data.expenseRatio}%</div></div>
        </div>
        <div className="alloc-card">
          <div className="alloc-title">Current Allocation</div>
          <div className="alloc-bar">
            <div className="alloc-seg" style={{width:data.allocation.equity+'%', background:'linear-gradient(90deg,#4F46E5,#7C3AED)'}}></div>
            <div className="alloc-seg" style={{width:data.allocation.debt+'%', background:'#10B981'}}></div>
            <div className="alloc-seg" style={{width:data.allocation.gold+'%', background:'#F59E0B'}}></div>
          </div>
          <div className="alloc-leg">
            <div className="al-item"><div className="al-dot" style={{background:'#4F46E5'}}></div>Equity {data.allocation.equity}%</div>
            <div className="al-item"><div className="al-dot" style={{background:'#10B981'}}></div>Debt {data.allocation.debt}%</div>
            <div className="al-item"><div className="al-dot" style={{background:'#F59E0B'}}></div>Gold {data.allocation.gold}%</div>
          </div>
        </div>
        <div className="list-card">
          <div className="lc-title">⚠️ Issues Found</div>
          {data.issues.map((iss, i) => (
            <div className="lc-row" key={i}><div className="lc-ico">{iss.level}</div><div className="lc-text">{iss.text}</div></div>
          ))}
        </div>
        <div className="list-card">
          <div className="lc-title">✅ Recommendations</div>
          {data.recommendations.map((rec, i) => (
            <div className="lc-row" key={i}><div className="lc-ico">✅</div><div className="lc-text">{rec}</div></div>
          ))}
        </div>
        <Link href="/chat?q=Create+my+portfolio+rebalancing+plan" className="action-btn" style={{display:'block',textAlign:'center'}}>💬 Get Rebalancing Plan</Link>
      </div></div>
      <BottomNav />
    </div>
  );
}
