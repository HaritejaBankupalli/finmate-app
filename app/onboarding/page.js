'use client';
import { useState } from 'react';
import { useRouter } from 'next/navigation';

const GOALS = [
  { icon: '🏠', name: 'House' }, { icon: '🏖️', name: 'Retire' }, { icon: '✈️', name: 'Travel' },
  { icon: '🎓', name: 'Education' }, { icon: '🚗', name: 'Car' }, { icon: '💍', name: 'Wedding' }
];

export default function Onboarding() {
  const router = useRouter();
  const [step, setStep] = useState(0);
  const [loading, setLoading] = useState(false);
  const [isCouple, setIsCouple] = useState(false);

  // Individual data
  const [data, setData] = useState({
    age: 28, income: 75000, city: 'Bangalore',
    expenses: 30000, hasEmi: true, emi: 12000, savings: 33000,
    goals: ['House', 'Retire'], retirementYear: 2045,
    mutual_funds: 150000, stocks: 50000, fd_ppf: 100000, gold: 25000,
    risk_level: 'moderate'
  });

  // Partner data
  const [partner, setPartner] = useState({
    name: '', age: 26, income: 60000,
    expenses: 25000, emi: 0, savings: 35000,
    mutual_funds: 100000, stocks: 30000, fd_ppf: 50000, gold: 10000
  });

  const upd = (k, v) => setData(p => ({ ...p, [k]: v }));
  const updP = (k, v) => setPartner(p => ({ ...p, [k]: v }));
  const toggleGoal = (g) => {
    setData(p => ({
      ...p,
      goals: p.goals.includes(g) ? p.goals.filter(x => x !== g) : [...p.goals, g]
    }));
  };

  // Steps differ based on mode
  const STEPS_INDIVIDUAL = [
    { h: 'Select Mode', s: 'Step 1 · Individual or Couple?' },
    { h: 'Basic Info', s: 'Step 2 · Tell us about you' },
    { h: 'Monthly Expenses', s: 'Step 3 · Your spending' },
    { h: 'Your Goals', s: 'Step 4 · What are you saving for?' },
    { h: 'Investments', s: 'Step 5 · Current portfolio' },
    { h: 'Risk Profile', s: 'Step 6 · Your investor type' }
  ];

  const STEPS_COUPLE = [
    { h: 'Select Mode', s: 'Step 1 · Individual or Couple?' },
    { h: 'Your Info', s: 'Step 2 · Person 1 details' },
    { h: 'Your Expenses', s: 'Step 3 · Person 1 spending' },
    { h: 'Partner Info', s: 'Step 4 · Person 2 details' },
    { h: 'Partner Expenses', s: 'Step 5 · Person 2 spending' },
    { h: 'Joint Goals', s: 'Step 6 · What are you both saving for?' },
    { h: 'Joint Investments', s: 'Step 7 · Both portfolios' },
    { h: 'Risk Profile', s: 'Step 8 · Your investor type' }
  ];

  const STEPS = isCouple ? STEPS_COUPLE : STEPS_INDIVIDUAL;
  const totalSteps = STEPS.length;
  const lastStep = totalSteps - 1;

  async function finish() {
    setLoading(true);
    const body = {
      mode: isCouple ? 'couple' : 'individual',
      age: Number(data.age), income: Number(data.income), city: data.city,
      expenses: Number(data.expenses), emi: data.hasEmi ? Number(data.emi) : 0,
      savings: Number(data.savings), goals: JSON.stringify(data.goals),
      retirement_year: Number(data.retirementYear),
      mutual_funds: Number(data.mutual_funds), stocks: Number(data.stocks),
      fd_ppf: Number(data.fd_ppf), gold: Number(data.gold),
      risk_level: data.risk_level
    };
    if (isCouple) {
      body.partner_name = partner.name;
      body.partner_age = Number(partner.age);
      body.partner_income = Number(partner.income);
      body.partner_expenses = Number(partner.expenses);
      body.partner_emi = Number(partner.emi);
      body.partner_savings = Number(partner.savings);
      body.partner_mutual_funds = Number(partner.mutual_funds);
      body.partner_stocks = Number(partner.stocks);
      body.partner_fd_ppf = Number(partner.fd_ppf);
      body.partner_gold = Number(partner.gold);
    }
    await fetch('/api/profile', {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(body)
    });
    router.push('/dashboard');
  }

  function next() {
    if (step < lastStep) setStep(step + 1);
    else finish();
  }
  function prev() { if (step > 0) setStep(step - 1); }

  const coupleTheme = isCouple ? { background: 'linear-gradient(135deg, #E91E8C, #FF4D94)' } : {};
  const coupleClass = isCouple ? 'couple-mode' : '';

  return (
    <div className={`onboard-page ${coupleClass}`}>
      <div className="ob-top" style={coupleTheme}>
        <div className="ob-steps">
          {Array.from({ length: totalSteps }, (_, i) => (
            <div key={i} className={`ob-dot ${i === step ? 'active' : i < step ? 'done' : ''}`} />
          ))}
        </div>
        <div className="ob-h">{STEPS[step].h}</div>
        <div className="ob-sh">{STEPS[step].s}</div>
      </div>

      <div className="ob-body">
        {/* ─── STEP 0: MODE SELECT ─── */}
        {step === 0 && <>
          <div className="flabel">How would you like to plan?</div>
          <div className="mode-pill-row" style={{ marginBottom: 18 }}>
            <button className={`mode-pill ${!isCouple ? 'on' : ''}`} onClick={() => setIsCouple(false)}>
              <span className="mp-ico">👤</span> Individual
            </button>
            <button className={`mode-pill ${isCouple ? 'on' : ''}`} onClick={() => setIsCouple(true)}>
              <span className="mp-ico">💕</span> Couple
            </button>
          </div>
          <div style={{ padding: 16, background: 'var(--surface)', borderRadius: 14, border: '2px solid var(--border)' }}>
            {!isCouple ? (
              <>
                <div style={{ fontSize: 32, marginBottom: 8 }}>👤</div>
                <div style={{ fontSize: 15, fontWeight: 700, color: 'var(--text)', marginBottom: 4 }}>Individual Mode</div>
                <div style={{ fontSize: 13, color: 'var(--text2)', lineHeight: 1.5 }}>
                  Plan your personal finances — income, expenses, investments, and FIRE goals. You can switch to couple mode later from the dashboard.
                </div>
              </>
            ) : (
              <>
                <div style={{ fontSize: 32, marginBottom: 8 }}>💕</div>
                <div style={{ fontSize: 15, fontWeight: 700, color: 'var(--text)', marginBottom: 4 }}>Couple Mode</div>
                <div style={{ fontSize: 13, color: 'var(--text2)', lineHeight: 1.5 }}>
                  Plan together! Enter both partners&apos; details — income, expenses, and investments. Get a joint FIRE plan, combined health score, and shared budget tracker.
                </div>
              </>
            )}
          </div>
        </>}

        {/* ─── INDIVIDUAL: STEP 1 — Basic Info ─── */}
        {!isCouple && step === 1 && <>
          <div className="frow"><div className="flabel">Your Age</div>
            <input className="finput" type="number" value={data.age} onChange={e => upd('age', e.target.value)} placeholder="e.g. 28" /></div>
          <div className="frow"><div className="flabel">Monthly Income (₹)</div>
            <input className="finput" type="number" value={data.income} onChange={e => upd('income', e.target.value)} placeholder="e.g. 75,000" /></div>
          <div className="frow"><div className="flabel">City</div>
            <input className="finput" type="text" value={data.city} onChange={e => upd('city', e.target.value)} placeholder="Your city" /></div>
        </>}

        {/* ─── INDIVIDUAL: STEP 2 — Expenses ─── */}
        {!isCouple && step === 2 && <>
          <div className="frow"><div className="flabel">Monthly Expenses (₹)</div>
            <input className="finput" type="number" value={data.expenses} onChange={e => upd('expenses', e.target.value)} /></div>
          <div className="frow">
            <div className="flabel">Do you have Loans / EMIs?</div>
            <div className="seg-row">
              <button className={`seg-btn ${data.hasEmi ? 'on' : ''}`} onClick={() => upd('hasEmi', true)}>Yes</button>
              <button className={`seg-btn ${!data.hasEmi ? 'on' : ''}`} onClick={() => upd('hasEmi', false)}>No</button>
            </div>
          </div>
          {data.hasEmi && <div className="frow"><div className="flabel">EMI Amount (₹ / month)</div>
            <input className="finput" type="number" value={data.emi} onChange={e => upd('emi', e.target.value)} /></div>}
          <div className="frow"><div className="flabel">Monthly Savings (₹)</div>
            <input className="finput" type="number" value={data.savings} onChange={e => upd('savings', e.target.value)} /></div>
        </>}

        {/* ─── INDIVIDUAL: STEP 3 — Goals ─── */}
        {!isCouple && step === 3 && <>
          <div className="flabel" style={{ marginBottom: 12 }}>Choose your Goals</div>
          <div className="goal-grid">
            {GOALS.map(g => (
              <div key={g.name} className={`goal-item ${data.goals.includes(g.name) ? 'on' : ''}`} onClick={() => toggleGoal(g.name)}>
                <div className="gi">{g.icon}</div><div className="gn">{g.name}</div>
              </div>
            ))}
          </div>
          <div className="frow" style={{ marginTop: 14 }}><div className="flabel">Target Retirement Year</div>
            <input className="finput" type="number" value={data.retirementYear} onChange={e => upd('retirementYear', e.target.value)} /></div>
        </>}

        {/* ─── INDIVIDUAL: STEP 4 — Investments ─── */}
        {!isCouple && step === 4 && <>
          <div className="frow"><div className="flabel">Mutual Funds (₹)</div><input className="finput" type="number" value={data.mutual_funds} onChange={e => upd('mutual_funds', e.target.value)} /></div>
          <div className="frow"><div className="flabel">Stocks / Equity (₹)</div><input className="finput" type="number" value={data.stocks} onChange={e => upd('stocks', e.target.value)} /></div>
          <div className="frow"><div className="flabel">FD / PPF / NPS (₹)</div><input className="finput" type="number" value={data.fd_ppf} onChange={e => upd('fd_ppf', e.target.value)} /></div>
          <div className="frow"><div className="flabel">Gold / Others (₹)</div><input className="finput" type="number" value={data.gold} onChange={e => upd('gold', e.target.value)} /></div>
        </>}

        {/* ─── INDIVIDUAL: STEP 5 — Risk ─── */}
        {!isCouple && step === 5 && <>
          <div className="flabel" style={{ marginBottom: 12 }}>How do you react to market drops?</div>
          <div className="risk-list">
            {[
              { id: 'conservative', icon: '😰', name: 'Conservative', sub: 'Sell quickly, protect capital first' },
              { id: 'moderate', icon: '😐', name: 'Moderate', sub: 'Hold and wait for recovery' },
              { id: 'aggressive', icon: '😎', name: 'Aggressive', sub: 'Buy more when markets dip' }
            ].map(r => (
              <div key={r.id} className={`risk-item ${data.risk_level === r.id ? 'on' : ''}`} onClick={() => upd('risk_level', r.id)}>
                <div className="ri-ico">{r.icon}</div>
                <div><div className="ri-name">{r.name}</div><div className="ri-sub">{r.sub}</div></div>
              </div>
            ))}
          </div>
        </>}

        {/* ═══════════════════════════════════════════
            COUPLE MODE STEPS
        ═══════════════════════════════════════════ */}

        {/* ─── COUPLE: STEP 1 — Person 1 Basic ─── */}
        {isCouple && step === 1 && <>
          <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 16, padding: '12px 14px', background: 'rgba(79,70,229,.06)', borderRadius: 12, border: '2px solid rgba(79,70,229,.15)' }}>
            <span style={{ fontSize: 24 }}>👤</span>
            <div><div style={{ fontSize: 14, fontWeight: 700, color: 'var(--text)' }}>Your Details (Person 1)</div>
              <div style={{ fontSize: 12, color: 'var(--text2)' }}>We&apos;ll ask for your partner&apos;s details next</div></div>
          </div>
          <div className="frow"><div className="flabel">Your Age</div>
            <input className="finput" type="number" value={data.age} onChange={e => upd('age', e.target.value)} placeholder="e.g. 28" /></div>
          <div className="frow"><div className="flabel">Monthly Income (₹)</div>
            <input className="finput" type="number" value={data.income} onChange={e => upd('income', e.target.value)} placeholder="e.g. 75,000" /></div>
          <div className="frow"><div className="flabel">City</div>
            <input className="finput" type="text" value={data.city} onChange={e => upd('city', e.target.value)} placeholder="Your city" /></div>
        </>}

        {/* ─── COUPLE: STEP 2 — Person 1 Expenses ─── */}
        {isCouple && step === 2 && <>
          <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 16, padding: '12px 14px', background: 'rgba(79,70,229,.06)', borderRadius: 12, border: '2px solid rgba(79,70,229,.15)' }}>
            <span style={{ fontSize: 24 }}>👤</span>
            <div><div style={{ fontSize: 14, fontWeight: 700, color: 'var(--text)' }}>Your Expenses (Person 1)</div></div>
          </div>
          <div className="frow"><div className="flabel">Monthly Expenses (₹)</div>
            <input className="finput" type="number" value={data.expenses} onChange={e => upd('expenses', e.target.value)} /></div>
          <div className="frow">
            <div className="flabel">Do you have Loans / EMIs?</div>
            <div className="seg-row">
              <button className={`seg-btn ${data.hasEmi ? 'on' : ''}`} onClick={() => upd('hasEmi', true)}>Yes</button>
              <button className={`seg-btn ${!data.hasEmi ? 'on' : ''}`} onClick={() => upd('hasEmi', false)}>No</button>
            </div>
          </div>
          {data.hasEmi && <div className="frow"><div className="flabel">EMI Amount (₹ / month)</div>
            <input className="finput" type="number" value={data.emi} onChange={e => upd('emi', e.target.value)} /></div>}
          <div className="frow"><div className="flabel">Monthly Savings (₹)</div>
            <input className="finput" type="number" value={data.savings} onChange={e => upd('savings', e.target.value)} /></div>
        </>}

        {/* ─── COUPLE: STEP 3 — Person 2 Basic ─── */}
        {isCouple && step === 3 && <>
          <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 16, padding: '12px 14px', background: 'rgba(233,30,140,.06)', borderRadius: 12, border: '2px solid rgba(233,30,140,.15)' }}>
            <span style={{ fontSize: 24 }}>💕</span>
            <div><div style={{ fontSize: 14, fontWeight: 700, color: '#E91E8C' }}>Partner&apos;s Details (Person 2)</div>
              <div style={{ fontSize: 12, color: 'var(--text2)' }}>Now let&apos;s get your partner&apos;s info</div></div>
          </div>
          <div className="frow"><div className="flabel">Partner&apos;s Name</div>
            <input className="finput" value={partner.name} onChange={e => updP('name', e.target.value)} placeholder="e.g. Priya" /></div>
          <div className="frow"><div className="flabel">Partner&apos;s Age</div>
            <input className="finput" type="number" value={partner.age} onChange={e => updP('age', e.target.value)} /></div>
          <div className="frow"><div className="flabel">Monthly Income (₹)</div>
            <input className="finput" type="number" value={partner.income} onChange={e => updP('income', e.target.value)} /></div>
        </>}

        {/* ─── COUPLE: STEP 4 — Person 2 Expenses ─── */}
        {isCouple && step === 4 && <>
          <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 16, padding: '12px 14px', background: 'rgba(233,30,140,.06)', borderRadius: 12, border: '2px solid rgba(233,30,140,.15)' }}>
            <span style={{ fontSize: 24 }}>💕</span>
            <div><div style={{ fontSize: 14, fontWeight: 700, color: '#E91E8C' }}>{partner.name || 'Partner'}&apos;s Expenses</div></div>
          </div>
          <div className="frow"><div className="flabel">Monthly Expenses (₹)</div>
            <input className="finput" type="number" value={partner.expenses} onChange={e => updP('expenses', e.target.value)} /></div>
          <div className="frow"><div className="flabel">EMI (₹ / month)</div>
            <input className="finput" type="number" value={partner.emi} onChange={e => updP('emi', e.target.value)} /></div>
          <div className="frow"><div className="flabel">Monthly Savings (₹)</div>
            <input className="finput" type="number" value={partner.savings} onChange={e => updP('savings', e.target.value)} /></div>
        </>}

        {/* ─── COUPLE: STEP 5 — Joint Goals ─── */}
        {isCouple && step === 5 && <>
          <div className="flabel" style={{ marginBottom: 12 }}>Choose your Joint Goals</div>
          <div className="goal-grid">
            {GOALS.map(g => (
              <div key={g.name} className={`goal-item ${data.goals.includes(g.name) ? 'on' : ''}`} onClick={() => toggleGoal(g.name)}>
                <div className="gi">{g.icon}</div><div className="gn">{g.name}</div>
              </div>
            ))}
          </div>
          <div className="frow" style={{ marginTop: 14 }}><div className="flabel">Target Retirement Year</div>
            <input className="finput" type="number" value={data.retirementYear} onChange={e => upd('retirementYear', e.target.value)} /></div>
        </>}

        {/* ─── COUPLE: STEP 6 — Joint Investments ─── */}
        {isCouple && step === 6 && <>
          <div style={{ fontSize: 13, fontWeight: 700, color: 'var(--text)', padding: '0 0 10px', display: 'flex', alignItems: 'center', gap: 8 }}>👤 Your Investments</div>
          <div className="frow"><div className="flabel">Mutual Funds (₹)</div><input className="finput" type="number" value={data.mutual_funds} onChange={e => upd('mutual_funds', e.target.value)} /></div>
          <div className="frow"><div className="flabel">Stocks / Equity (₹)</div><input className="finput" type="number" value={data.stocks} onChange={e => upd('stocks', e.target.value)} /></div>
          <div className="frow"><div className="flabel">FD / PPF / NPS (₹)</div><input className="finput" type="number" value={data.fd_ppf} onChange={e => upd('fd_ppf', e.target.value)} /></div>
          <div className="frow"><div className="flabel">Gold / Others (₹)</div><input className="finput" type="number" value={data.gold} onChange={e => upd('gold', e.target.value)} /></div>

          <div style={{ height: 1, background: 'var(--border)', margin: '12px 0' }}></div>
          <div style={{ fontSize: 13, fontWeight: 700, color: '#E91E8C', padding: '0 0 10px', display: 'flex', alignItems: 'center', gap: 8 }}>💕 {partner.name || 'Partner'}&apos;s Investments</div>
          <div className="frow"><div className="flabel">Mutual Funds (₹)</div><input className="finput" type="number" value={partner.mutual_funds} onChange={e => updP('mutual_funds', e.target.value)} /></div>
          <div className="frow"><div className="flabel">Stocks / Equity (₹)</div><input className="finput" type="number" value={partner.stocks} onChange={e => updP('stocks', e.target.value)} /></div>
          <div className="frow"><div className="flabel">FD / PPF / NPS (₹)</div><input className="finput" type="number" value={partner.fd_ppf} onChange={e => updP('fd_ppf', e.target.value)} /></div>
          <div className="frow"><div className="flabel">Gold / Others (₹)</div><input className="finput" type="number" value={partner.gold} onChange={e => updP('gold', e.target.value)} /></div>
        </>}

        {/* ─── COUPLE: STEP 7 — Risk ─── */}
        {isCouple && step === 7 && <>
          <div className="flabel" style={{ marginBottom: 12 }}>How do you both react to market drops?</div>
          <div className="risk-list">
            {[
              { id: 'conservative', icon: '😰', name: 'Conservative', sub: 'Sell quickly, protect capital first' },
              { id: 'moderate', icon: '😐', name: 'Moderate', sub: 'Hold and wait for recovery' },
              { id: 'aggressive', icon: '😎', name: 'Aggressive', sub: 'Buy more when markets dip' }
            ].map(r => (
              <div key={r.id} className={`risk-item ${data.risk_level === r.id ? 'on' : ''}`} onClick={() => upd('risk_level', r.id)}>
                <div className="ri-ico">{r.icon}</div>
                <div><div className="ri-name">{r.name}</div><div className="ri-sub">{r.sub}</div></div>
              </div>
            ))}
          </div>
        </>}
      </div>

      <div className="ob-foot">
        <div style={{ display: 'flex', gap: 10 }}>
          {step > 0 && (
            <button className="ob-next" style={{ flex: '0 0 auto', width: 'auto', padding: '17px 24px', background: 'var(--surface2)', color: 'var(--text)', boxShadow: 'none' }} onClick={prev}>
              ← Back
            </button>
          )}
          <button className="ob-next" style={coupleTheme} onClick={next} disabled={loading || (isCouple && step === 3 && !partner.name)}>
            {loading ? 'Setting up...' : step === lastStep ? '🚀 Generate My Plan' : 'Continue →'}
          </button>
        </div>
      </div>
    </div>
  );
}
