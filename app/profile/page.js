'use client';
import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import BottomNav from '@/components/BottomNav';

export default function ProfilePage() {
  const router = useRouter();
  const [profile, setProfile] = useState(null);
  const [user, setUser] = useState(null);
  const [toast, setToast] = useState('');
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    Promise.all([
      fetch('/api/profile').then(r => r.json()),
      fetch('/api/auth/me').then(r => r.json())
    ]).then(([p, u]) => {
      if (u.error) { router.replace('/login'); return; }
      setProfile(p.profile);
      setUser(u.user);
    });
  }, []);

  const upd = (k, v) => setProfile(p => ({ ...p, [k]: v }));

  async function save() {
    setLoading(true);
    await fetch('/api/profile', {
      method: 'PUT', headers: {'Content-Type':'application/json'},
      body: JSON.stringify({
        name: profile.name, age: Number(profile.age), income: Number(profile.income),
        expenses: Number(profile.expenses), emi: Number(profile.emi), savings: Number(profile.savings),
        city: profile.city, retirement_year: Number(profile.retirement_year),
        mutual_funds: Number(profile.mutual_funds), stocks: Number(profile.stocks),
        fd_ppf: Number(profile.fd_ppf), gold: Number(profile.gold),
        risk_level: profile.risk_level,
        partner_name: profile.partner_name || '',
        partner_age: Number(profile.partner_age) || 0,
        partner_income: Number(profile.partner_income) || 0,
        partner_expenses: Number(profile.partner_expenses) || 0,
        partner_emi: Number(profile.partner_emi) || 0,
        partner_mutual_funds: Number(profile.partner_mutual_funds) || 0,
        partner_stocks: Number(profile.partner_stocks) || 0,
        partner_fd_ppf: Number(profile.partner_fd_ppf) || 0,
        partner_gold: Number(profile.partner_gold) || 0
      })
    });
    setLoading(false);
    setToast('✅ Profile saved! Dashboard updated.');
    setTimeout(() => setToast(''), 2500);
  }

  async function logout() {
    await fetch('/api/auth/logout', { method: 'POST' });
    router.push('/');
  }

  if (!profile) return <div style={{minHeight:'100vh',display:'flex',alignItems:'center',justifyContent:'center'}}><div className="spinner"></div></div>;

  const isCouple = user?.mode === 'couple';

  return (
    <div className={isCouple ? 'couple-mode inner-page' : 'inner-page'}>
      <div className="is-header ish-profile">
        <Link href="/dashboard" className="is-back">← Back</Link>
        <div className="is-title">👤 Profile & Settings</div>
        <div className="is-sub">Edit your financial data</div>
      </div>
      <div className="scroller"><div className="is-body">
        <div className="list-card">
          <div className="lc-title">👤 Personal Info</div>
          <div className="frow"><div className="flabel">Name</div>
            <input className="finput" value={profile.name || ''} onChange={e => upd('name', e.target.value)} /></div>
          <div className="frow"><div className="flabel">Age</div>
            <input className="finput" type="number" value={profile.age || ''} onChange={e => upd('age', e.target.value)} /></div>
          <div className="frow"><div className="flabel">City</div>
            <input className="finput" value={profile.city || ''} onChange={e => upd('city', e.target.value)} /></div>
        </div>

        <div className="list-card">
          <div className="lc-title">💰 Income & Expenses</div>
          <div className="frow"><div className="flabel">Monthly Income (₹)</div>
            <input className="finput" type="number" value={profile.income || ''} onChange={e => upd('income', e.target.value)} /></div>
          <div className="frow"><div className="flabel">Monthly Expenses (₹)</div>
            <input className="finput" type="number" value={profile.expenses || ''} onChange={e => upd('expenses', e.target.value)} /></div>
          <div className="frow"><div className="flabel">EMI (₹/month)</div>
            <input className="finput" type="number" value={profile.emi || ''} onChange={e => upd('emi', e.target.value)} /></div>
          <div className="frow"><div className="flabel">Retirement Year</div>
            <input className="finput" type="number" value={profile.retirement_year || ''} onChange={e => upd('retirement_year', e.target.value)} /></div>
        </div>

        <div className="list-card">
          <div className="lc-title">📈 Investments</div>
          <div className="frow"><div className="flabel">Mutual Funds (₹)</div>
            <input className="finput" type="number" value={profile.mutual_funds || ''} onChange={e => upd('mutual_funds', e.target.value)} /></div>
          <div className="frow"><div className="flabel">Stocks (₹)</div>
            <input className="finput" type="number" value={profile.stocks || ''} onChange={e => upd('stocks', e.target.value)} /></div>
          <div className="frow"><div className="flabel">FD / PPF / NPS (₹)</div>
            <input className="finput" type="number" value={profile.fd_ppf || ''} onChange={e => upd('fd_ppf', e.target.value)} /></div>
          <div className="frow"><div className="flabel">Gold / Others (₹)</div>
            <input className="finput" type="number" value={profile.gold || ''} onChange={e => upd('gold', e.target.value)} /></div>
          <div className="frow"><div className="flabel">Risk Level</div>
            <select className="finput" value={profile.risk_level || 'moderate'} onChange={e => upd('risk_level', e.target.value)}>
              <option value="conservative">😰 Conservative</option>
              <option value="moderate">😐 Moderate</option>
              <option value="aggressive">😎 Aggressive</option>
            </select>
          </div>
        </div>

        {isCouple && (
          <div className="list-card" style={{borderLeft:'4px solid #E91E8C'}}>
            <div className="lc-title">💕 Partner Info</div>
            <div className="frow"><div className="flabel">Partner Name</div>
              <input className="finput" value={profile.partner_name || ''} onChange={e => upd('partner_name', e.target.value)} /></div>
            <div className="frow"><div className="flabel">Age</div>
              <input className="finput" type="number" value={profile.partner_age || ''} onChange={e => upd('partner_age', e.target.value)} /></div>
            <div className="frow"><div className="flabel">Monthly Income (₹)</div>
              <input className="finput" type="number" value={profile.partner_income || ''} onChange={e => upd('partner_income', e.target.value)} /></div>
            <div className="frow"><div className="flabel">Monthly Expenses (₹)</div>
              <input className="finput" type="number" value={profile.partner_expenses || ''} onChange={e => upd('partner_expenses', e.target.value)} /></div>
            <div className="frow"><div className="flabel">Partner EMI (₹)</div>
              <input className="finput" type="number" value={profile.partner_emi || ''} onChange={e => upd('partner_emi', e.target.value)} /></div>
            <div className="frow"><div className="flabel">Mutual Funds (₹)</div>
              <input className="finput" type="number" value={profile.partner_mutual_funds || ''} onChange={e => upd('partner_mutual_funds', e.target.value)} /></div>
            <div className="frow"><div className="flabel">Stocks (₹)</div>
              <input className="finput" type="number" value={profile.partner_stocks || ''} onChange={e => upd('partner_stocks', e.target.value)} /></div>
            <div className="frow"><div className="flabel">FD / PPF / NPS (₹)</div>
              <input className="finput" type="number" value={profile.partner_fd_ppf || ''} onChange={e => upd('partner_fd_ppf', e.target.value)} /></div>
            <div className="frow"><div className="flabel">Gold (₹)</div>
              <input className="finput" type="number" value={profile.partner_gold || ''} onChange={e => upd('partner_gold', e.target.value)} /></div>
          </div>
        )}

        <button className="action-btn" onClick={save} disabled={loading} style={{marginBottom:12}}>
          {loading ? 'Saving...' : '💾 Save Changes'}
        </button>
        <button className="action-btn" style={{background:'var(--red)',boxShadow:'0 6px 20px rgba(239,68,68,.3)'}} onClick={logout}>
          🚪 Logout
        </button>
      </div></div>
      {toast && <div className="save-toast">{toast}</div>}
      <BottomNav />
    </div>
  );
}
