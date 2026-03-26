'use client';
import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import BottomNav from '@/components/BottomNav';
import Link from 'next/link';

function fmt(n) {
  if (!n || n === 0) return '₹0';
  if (n >= 10000000) return '₹' + (n / 10000000).toFixed(1) + ' Cr';
  if (n >= 100000) return '₹' + (n / 100000).toFixed(1) + 'L';
  if (n >= 1000) return '₹' + (n / 1000).toFixed(0) + 'K';
  return '₹' + n;
}

export default function Dashboard() {
  const router = useRouter();
  const [user, setUser] = useState(null);
  const [profile, setProfile] = useState(null);
  const [fire, setFire] = useState(null);
  const [coupleMode, setCoupleMode] = useState(false);
  const [showNotifs, setShowNotifs] = useState(false);
  const [notifs, setNotifs] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => { loadData(); }, []);

  async function loadData() {
    try {
      const [ur, pr] = await Promise.all([
        fetch('/api/auth/me').then(r => r.json()),
        fetch('/api/profile').then(r => r.json())
      ]);
      if (ur.error) { router.replace('/login'); return; }
      setUser(ur.user);
      setProfile(pr.profile);
      setCoupleMode(ur.user.mode === 'couple');
      const fr = await fetch('/api/fire', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: '{}' }).then(r => r.json());
      setFire(fr);
      const nr = await fetch('/api/notifications').then(r => r.json());
      setNotifs(nr.notifications || []);
    } catch { router.replace('/login'); }
    setLoading(false);
  }

  async function toggleMode() {
    const newMode = coupleMode ? 'individual' : 'couple';
    await fetch('/api/profile', { method: 'PUT', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ mode: newMode }) });
    setCoupleMode(!coupleMode);
    if (newMode === 'couple') router.push('/couple-setup');
    else loadData();
  }

  if (loading) return <div style={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center' }}><div className="spinner"></div></div>;
  if (!user || !profile) return null;

  const income = Number(profile.income) || 0;
  const expenses = Number(profile.expenses) || 0;
  const emi = Number(profile.emi) || 0;
  const savings = income - expenses - emi;
  const mf = Number(profile.mutual_funds) || 0;
  const stocks = Number(profile.stocks) || 0;
  const fd = Number(profile.fd_ppf) || 0;
  const gold = Number(profile.gold) || 0;
  const nw = mf + stocks + fd + gold;
  const savingsPct = income > 0 ? Math.round((savings / income) * 100) : 0;
  const emergencyPct = Math.min(100, Math.round((savings * 3 / (expenses * 3 || 1)) * 100));
  const investPct = Math.min(100, income > 0 ? Math.round(((mf + stocks) / (income * 12)) * 100) : 0);
  const debtPct = income > 0 ? Math.min(100, 100 - Math.round((emi / income) * 100)) : 100;
  const taxPct = Math.min(100, Math.round((Number(profile.investments_80c) || 0) / 1500));
  const retPct = fire ? Math.min(100, Math.round((nw / (fire.corpus || 1)) * 100)) : 0;
  const score = Math.round((emergencyPct + debtPct + investPct + taxPct + retPct + savingsPct) / 6);
  const scoreBadge = score >= 80 ? '🟢 Excellent' : score >= 60 ? '🟡 Good' : score >= 40 ? '🟠 Fair' : '🔴 Needs Work';
  const unread = notifs.filter(n => !n.is_read).length;
  const h = new Date().getHours();
  const greet = h < 12 ? 'Good morning 👋' : h < 17 ? 'Good afternoon 👋' : 'Good evening 👋';

  return (
    <div className={coupleMode ? 'couple-mode' : ''}>
      <div className="app-header">
        <div className="ah-row">
          <div>
            <div className="ah-greet">{greet}</div>
            <div className="ah-name">{user.name}</div>
          </div>
          <div className="ah-right">
            <div className="ah-bell" onClick={() => setShowNotifs(true)}>
              🔔 {unread > 0 && <span className="notif-dot"></span>}
            </div>
            <Link href="/profile" className="ah-av">{user.name?.charAt(0)?.toUpperCase()}</Link>
          </div>
        </div>
      </div>

      {/* Mode bar */}
      <div className="mode-bar">
        <button className={`mb-btn ${!coupleMode ? 'on' : ''}`} onClick={() => coupleMode && toggleMode()}>
          <span className="mb-ico">👤</span> Individual
        </button>
        <button className={`mb-btn ${coupleMode ? 'on' : ''}`} onClick={() => !coupleMode && toggleMode()}>
          <span className="mb-ico">💕</span> Couple Mode
        </button>
      </div>

      {/* Couple banner */}
      {coupleMode && (
        <div className="couple-banner">
          <div className="cb-avs"><div className="cb-av">👨</div><div className="cb-av">👩</div></div>
          <div style={{ flex: 1 }}>
            <div className="cb-name">{user.name} & {profile.partner_name || 'Partner'}</div>
            <div className="cb-sub">Combined Net Worth {fmt(nw)} · Joint FIRE</div>
          </div>
        </div>
      )}

      <div className="scroller">
        {/* Score card */}
        <div className="score-card fu">
          <div className="sc-ring"><div className="sc-num">{score}</div><div className="sc-den">/100</div></div>
          <div>
            <div className="sc-title">{coupleMode ? 'Joint Money Health' : 'Money Health Score'}</div>
            <div className="sc-sub">{coupleMode ? `${user.name} & ${profile.partner_name || 'Partner'} · Combined score` : score >= 60 ? "You're doing well! A few tweaks can push you higher" : 'Room for improvement — check your action items'}</div>
            <div className="sc-badge">{scoreBadge} · Tap for details</div>
          </div>
        </div>

        {/* Health breakdown */}
        <div className="sec-hdr"><div className="sh-title">Health Breakdown</div><Link href="/fire" className="sh-link">View Plan →</Link></div>
        <div className="health-card fu d1">
          {[
            { ico: '🏦', bg: '#FEF3C7', label: 'Emergency Fund', pct: emergencyPct, color: emergencyPct >= 60 ? '#10B981' : '#F59E0B' },
            { ico: '🛡️', bg: '#FEE2E2', label: 'Insurance', pct: 20, color: '#EF4444' },
            { ico: '📈', bg: '#EDE9FE', label: 'Investments', pct: investPct, color: '#7C3AED' },
            { ico: '💳', bg: '#D1FAE5', label: 'Debt Health', pct: debtPct, color: '#10B981' },
            { ico: '📑', bg: '#F3E8FF', label: 'Tax Efficiency', pct: taxPct, color: '#9333EA' },
            { ico: '🏖️', bg: '#FEF9C3', label: 'Retirement', pct: retPct, color: '#CA8A04' }
          ].map((m, i) => (
            <div className="hc-row" key={i}>
              <div className="hc-ico" style={{ background: m.bg }}>{m.ico}</div>
              <div className="hc-label">{m.label}</div>
              <div className="hc-pct" style={{ color: m.color }}>{m.pct}%</div>
              <div className="hc-track"><div className="hc-fill" style={{ width: m.pct + '%', background: m.color }}></div></div>
            </div>
          ))}
        </div>

        {/* FIRE Teaser */}
        {fire && <>
          <div className="sec-hdr"><div className="sh-title">🔥 FIRE Goal</div><Link href="/fire" className="sh-link">Full Plan →</Link></div>
          <Link href="/fire" style={{ textDecoration: 'none' }}>
            <div className="fire-teaser fu d2">
              <div className="ft-label">Retire at</div>
              <div className="ft-age"><span>{fire.retireAge}</span> years 🎯</div>
              <div className="ft-sub">SIP: {fmt(fire.sipNeeded)}/mo · Corpus: {fmt(fire.corpus)}</div>
              <div className="ft-chips">
                <div className="ft-chip">📅 Year {fire.retireYear}</div>
                <div className="ft-chip">Equity {fire.allocation?.equity}%</div>
                <div className="ft-chip">Gold {fire.allocation?.gold}%</div>
              </div>
            </div>
          </Link>
        </>}

        {/* Quick chips */}
        <div className="sec-hdr"><div className="sh-title">Quick Questions</div></div>
        <div className="chip-scroll">
          {['🔥 Retire at 45?', '📈 SIP amount?', '💰 Tax regime?', '📊 Overlap check', '🏦 Emergency fund'].map(q => (
            <Link key={q} href={`/chat?q=${encodeURIComponent(q.slice(2))}`} className="qchip">{q}</Link>
          ))}
        </div>

        {/* Feature cards */}
        <div className="sec-hdr"><div className="sh-title">Explore Features</div></div>
        <div className="feat-scroll">
          <Link href="/fire" className="fc fc-fire fu d1"><div className="fc-badge">FIRE</div><div className="fc-ico">🔥</div><div className="fc-name">FIRE Roadmap</div><div className="fc-desc">Retire early plan</div></Link>
          <Link href="/portfolio" className="fc fc-port fu d2"><div className="fc-badge">X-Ray</div><div className="fc-ico">📂</div><div className="fc-name">Portfolio X-Ray</div><div className="fc-desc">Fund overlap check</div></Link>
          <Link href="/tax" className="fc fc-tax fu d3"><div className="fc-badge">Save ₹</div><div className="fc-ico">📑</div><div className="fc-name">Tax Wizard</div><div className="fc-desc">Old vs New regime</div></Link>
          <Link href="/chat" className="fc fc-chat fu d4"><div className="fc-badge">AI</div><div className="fc-ico">💬</div><div className="fc-name">AI Advisor</div><div className="fc-desc">Ask anything</div></Link>
          <Link href="/schemes" className="fc fc-schemes"><div className="fc-badge">New</div><div className="fc-ico">🏛️</div><div className="fc-name">Govt. Schemes</div><div className="fc-desc">Invest & save tax</div></Link>
          <Link href="/budget" className="fc fc-budget"><div className="fc-ico">💸</div><div className="fc-name">Budget Tracker</div><div className="fc-desc">Income vs spend</div></Link>
          {!coupleMode && <div className="fc fc-couple" onClick={toggleMode}><div className="fc-badge">New</div><div className="fc-ico">💕</div><div className="fc-name">Couple Mode</div><div className="fc-desc">Joint finances</div></div>}
        </div>
        <div style={{ height: 20 }}></div>
      </div>

      {/* Notifications panel */}
      {showNotifs && (
        <div className="notif-panel" onClick={() => setShowNotifs(false)}>
          <div className="notif-sheet" onClick={e => e.stopPropagation()}>
            <h3 style={{ marginBottom: 16, fontSize: 18, fontWeight: 700 }}>🔔 Notifications</h3>
            {notifs.length === 0 && <p style={{ color: 'var(--text2)', fontSize: 13 }}>No notifications yet</p>}
            {notifs.map(n => (
              <div key={n.id} className={`notif-item ${!n.is_read ? 'unread' : ''}`}>
                <div className="notif-icon">{n.type === 'reminder' ? '⏰' : n.type === 'info' ? 'ℹ️' : '🔔'}</div>
                <div>
                  <div className="notif-title">{n.title}</div>
                  <div className="notif-msg">{n.message}</div>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      <BottomNav />
    </div>
  );
}
