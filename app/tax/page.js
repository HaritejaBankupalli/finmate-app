'use client';
import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import BottomNav from '@/components/BottomNav';

function fmt(n) { return '₹' + Math.round(n).toLocaleString('en-IN'); }

export default function TaxPage() {
  const router = useRouter();
  const [tax, setTax] = useState(null);
  const [mode, setMode] = useState('individual');
  const [showInput, setShowInput] = useState(false);
  const [salary, setSalary] = useState({ grossIncome:'', basic:'', hra:'', special:'', inv80c:'', inv80d:'', nps:'', rentPaid:'', city:'' });
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    Promise.all([
      fetch('/api/tax', { method:'POST', headers:{'Content-Type':'application/json'}, body:'{}' }).then(r => r.json()),
      fetch('/api/auth/me').then(r => r.json())
    ]).then(([t, u]) => {
      if (u.error) { router.replace('/login'); return; }
      setTax(t);
      setMode(u.user.mode);
    });
  }, []);

  async function recalc() {
    setLoading(true);
    const body = {};
    if (salary.grossIncome) body.grossIncome = Number(salary.grossIncome);
    if (salary.basic) body.basic = Number(salary.basic);
    if (salary.hra) body.hra = Number(salary.hra);
    if (salary.special) body.special = Number(salary.special);
    if (salary.inv80c) body.inv80c = Number(salary.inv80c);
    if (salary.inv80d) body.inv80d = Number(salary.inv80d);
    if (salary.nps) body.nps = Number(salary.nps);
    if (salary.rentPaid) body.rentPaid = Number(salary.rentPaid);
    if (salary.city) body.city = salary.city;
    const t = await fetch('/api/tax', { method:'POST', headers:{'Content-Type':'application/json'}, body:JSON.stringify(body) }).then(r => r.json());
    setTax(t);
    setShowInput(false);
    setLoading(false);
    // Save to profile
    await fetch('/api/profile', { method:'PUT', headers:{'Content-Type':'application/json'}, body:JSON.stringify({
      salary_basic: body.basic || 0, salary_hra: body.hra || 0, salary_special: body.special || 0,
      investments_80c: body.inv80c || 0, investments_80d: body.inv80d || 0, investments_nps: body.nps || 0, hra_rent: body.rentPaid || 0
    })});
  }

  const upd = (k, v) => setSalary(p => ({ ...p, [k]: v }));

  if (!tax) return <div style={{minHeight:'100vh',display:'flex',alignItems:'center',justifyContent:'center'}}><div className="spinner"></div></div>;

  return (
    <div className={mode === 'couple' ? 'couple-mode inner-page' : 'inner-page'}>
      <div className="is-header ish-tax">
        <Link href="/dashboard" className="is-back">← Back</Link>
        <div className="is-title">📑 Tax Wizard</div>
        <div className="is-sub">Old vs New regime · Save more</div>
      </div>
      <div className="scroller"><div className="is-body">
        {/* Compare cards */}
        <div className="tax-compare">
          <div className={`tc ${tax.bestRegime === 'new' ? 'win' : ''}`}>
            <div className="tc-lbl">New Regime</div>
            <div className="tc-amt">{fmt(tax.newTax)}</div>
            <div className="tc-tag">{tax.bestRegime === 'new' ? `Save ${fmt(tax.savings)}` : 'Higher Tax'}</div>
          </div>
          <div className={`tc ${tax.bestRegime === 'old' ? 'win' : ''}`}>
            <div className="tc-lbl">Old Regime ✓</div>
            <div className="tc-amt">{fmt(tax.oldTax)}</div>
            <div className="tc-tag">{tax.bestRegime === 'old' ? `Save ${fmt(tax.savings)}` : 'Higher Tax'}</div>
          </div>
        </div>

        <div className="stat-grid">
          <div className="stat-card"><div className="stat-ico">💰</div><div className="stat-lbl">You Save</div><div className="stat-val" style={{color:'#10B981'}}>{fmt(tax.savings)}</div></div>
          <div className="stat-card"><div className="stat-ico">📉</div><div className="stat-lbl">Best Regime</div><div className="stat-val">{tax.bestRegime === 'old' ? 'Old' : 'New'}</div></div>
          <div className="stat-card"><div className="stat-ico">💼</div><div className="stat-lbl">Gross Income</div><div className="stat-val">{fmt(tax.grossIncome)}</div></div>
          <div className="stat-card"><div className="stat-ico">📋</div><div className="stat-lbl">Std. Deduction</div><div className="stat-val">{fmt(tax.deductions.std)}</div></div>
        </div>

        {/* Salary input button */}
        <button className="action-btn" style={{marginBottom:16}} onClick={() => setShowInput(!showInput)}>
          {showInput ? '✕ Close' : '📄 Enter Salary Structure / Form 16'}
        </button>

        {showInput && (
          <div className="list-card" style={{marginBottom:16}}>
            <div className="lc-title">📄 Salary Structure</div>
            <div className="frow"><div className="flabel">Annual Gross Income (₹)</div>
              <input className="finput" type="number" value={salary.grossIncome} onChange={e => upd('grossIncome', e.target.value)} placeholder="e.g. 900000" /></div>
            <div className="frow"><div className="flabel">Basic Salary (₹/year)</div>
              <input className="finput" type="number" value={salary.basic} onChange={e => upd('basic', e.target.value)} placeholder="e.g. 450000" /></div>
            <div className="frow"><div className="flabel">HRA Received (₹/year)</div>
              <input className="finput" type="number" value={salary.hra} onChange={e => upd('hra', e.target.value)} placeholder="e.g. 180000" /></div>
            <div className="frow"><div className="flabel">Rent Paid (₹/year)</div>
              <input className="finput" type="number" value={salary.rentPaid} onChange={e => upd('rentPaid', e.target.value)} placeholder="e.g. 144000" /></div>
            <div className="frow"><div className="flabel">City (for HRA)</div>
              <input className="finput" type="text" value={salary.city} onChange={e => upd('city', e.target.value)} placeholder="e.g. Bangalore" /></div>
            <div style={{fontSize:13,fontWeight:700,color:'var(--text)',padding:'8px 0 4px'}}>Tax Saving Investments</div>
            <div className="frow"><div className="flabel">80C (ELSS/PPF/EPF) ₹</div>
              <input className="finput" type="number" value={salary.inv80c} onChange={e => upd('inv80c', e.target.value)} placeholder="Max 1,50,000" /></div>
            <div className="frow"><div className="flabel">80D (Health Insurance) ₹</div>
              <input className="finput" type="number" value={salary.inv80d} onChange={e => upd('inv80d', e.target.value)} placeholder="Max 25,000" /></div>
            <div className="frow"><div className="flabel">NPS 80CCD(1B) ₹</div>
              <input className="finput" type="number" value={salary.nps} onChange={e => upd('nps', e.target.value)} placeholder="Max 50,000" /></div>
            <button className="action-btn" onClick={recalc} disabled={loading}>{loading ? 'Calculating...' : '📊 Recalculate Tax'}</button>
          </div>
        )}

        {/* Missing deductions */}
        {tax.missing.length > 0 && (
          <div className="list-card">
            <div className="lc-title">📛 Missing Deductions</div>
            {tax.missing.map((m, i) => (
              <div className="lc-row" key={i}><div className="lc-ico">⚠️</div><div className="lc-text">{m.item} — saves {fmt(m.saveable)} tax</div></div>
            ))}
          </div>
        )}

        <div className="list-card">
          <div className="lc-title">✅ Action Plan</div>
          <div className="lc-row"><div className="lc-ico">✅</div><div className="lc-text">Max out 80C investments (₹1.5L limit)</div></div>
          <div className="lc-row"><div className="lc-ico">✅</div><div className="lc-text">Submit HRA proof to your employer</div></div>
          <div className="lc-row"><div className="lc-ico">✅</div><div className="lc-text">Open NPS Tier-1 for extra ₹50K deduction</div></div>
          <div className="lc-row"><div className="lc-ico">✅</div><div className="lc-text">Get health insurance for 80D deduction</div></div>
        </div>

        <Link href="/schemes" style={{display:'block',textDecoration:'none',marginBottom:12}}>
          <button className="action-btn" style={{background:'linear-gradient(135deg,#06B6D4,#0891B2)'}}>🏛️ Explore Tax Saving Schemes</button>
        </Link>
        <Link href="/chat?q=Help+me+save+maximum+tax+this+year" className="action-btn" style={{display:'block',textAlign:'center'}}>💬 Personalise Tax Plan</Link>
      </div></div>
      <BottomNav />
    </div>
  );
}
