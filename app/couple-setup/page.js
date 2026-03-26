'use client';
import { useState } from 'react';
import { useRouter } from 'next/navigation';

export default function CoupleSetup() {
  const router = useRouter();
  const [data, setData] = useState({
    partner_name: '', partner_age: 26, partner_income: 60000, partner_expenses: 25000,
    partner_emi: 0, partner_savings: 35000,
    partner_mutual_funds: 100000, partner_stocks: 30000, partner_fd_ppf: 50000, partner_gold: 10000
  });
  const [loading, setLoading] = useState(false);
  const upd = (k, v) => setData(p => ({ ...p, [k]: v }));

  async function save() {
    setLoading(true);
    await fetch('/api/profile', {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        mode: 'couple',
        partner_name: data.partner_name,
        partner_age: Number(data.partner_age),
        partner_income: Number(data.partner_income),
        partner_expenses: Number(data.partner_expenses),
        partner_emi: Number(data.partner_emi),
        partner_savings: Number(data.partner_savings),
        partner_mutual_funds: Number(data.partner_mutual_funds),
        partner_stocks: Number(data.partner_stocks),
        partner_fd_ppf: Number(data.partner_fd_ppf),
        partner_gold: Number(data.partner_gold)
      })
    });
    router.push('/dashboard');
  }

  return (
    <div className="onboard-page couple-mode">
      <div className="ob-top" style={{ background: 'linear-gradient(135deg, #E91E8C, #FF4D94)' }}>
        <div style={{ display: 'flex', gap: 12, alignItems: 'center', marginBottom: 8 }}>
          <div style={{ fontSize: 36 }}>💕</div>
          <div>
            <div className="ob-h">Couple Mode Setup</div>
            <div className="ob-sh">Enter your partner&lsquo;s financial details</div>
          </div>
        </div>
      </div>
      <div className="ob-body">
        <div className="frow"><div className="flabel">Partner&lsquo;s Name</div>
          <input className="finput" value={data.partner_name} onChange={e => upd('partner_name', e.target.value)} placeholder="e.g. Priya" /></div>
        <div className="frow"><div className="flabel">Partner&lsquo;s Age</div>
          <input className="finput" type="number" value={data.partner_age} onChange={e => upd('partner_age', e.target.value)} /></div>

        <div style={{ padding: '12px 0 4px', fontSize: 13, fontWeight: 700, color: 'var(--text)' }}>💰 Income & Expenses</div>
        <div className="frow"><div className="flabel">Monthly Income (₹)</div>
          <input className="finput" type="number" value={data.partner_income} onChange={e => upd('partner_income', e.target.value)} /></div>
        <div className="frow"><div className="flabel">Monthly Expenses (₹)</div>
          <input className="finput" type="number" value={data.partner_expenses} onChange={e => upd('partner_expenses', e.target.value)} /></div>
        <div className="frow"><div className="flabel">EMI (₹ / month)</div>
          <input className="finput" type="number" value={data.partner_emi} onChange={e => upd('partner_emi', e.target.value)} /></div>

        <div style={{ padding: '12px 0 4px', fontSize: 13, fontWeight: 700, color: 'var(--text)' }}>📈 Investments</div>
        <div className="frow"><div className="flabel">Mutual Funds (₹)</div>
          <input className="finput" type="number" value={data.partner_mutual_funds} onChange={e => upd('partner_mutual_funds', e.target.value)} /></div>
        <div className="frow"><div className="flabel">Stocks / Equity (₹)</div>
          <input className="finput" type="number" value={data.partner_stocks} onChange={e => upd('partner_stocks', e.target.value)} /></div>
        <div className="frow"><div className="flabel">FD / PPF / NPS (₹)</div>
          <input className="finput" type="number" value={data.partner_fd_ppf} onChange={e => upd('partner_fd_ppf', e.target.value)} /></div>
        <div className="frow"><div className="flabel">Gold / Others (₹)</div>
          <input className="finput" type="number" value={data.partner_gold} onChange={e => upd('partner_gold', e.target.value)} /></div>
      </div>
      <div className="ob-foot">
        <button className="ob-next" style={{ background: 'linear-gradient(135deg, #E91E8C, #FF4D94)' }} onClick={save} disabled={loading || !data.partner_name}>
          {loading ? 'Setting up...' : '💕 Activate Couple Mode'}
        </button>
      </div>
    </div>
  );
}
