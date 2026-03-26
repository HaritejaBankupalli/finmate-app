'use client';
import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import BottomNav from '@/components/BottomNav';

const CATEGORIES = {
  income: ['Salary', 'Freelance', 'Business', 'Interest', 'Rent', 'Other'],
  expense: ['Food', 'Rent', 'Transport', 'Shopping', 'Bills', 'EMI', 'Entertainment', 'Health', 'Education', 'Other']
};
const CAT_ICONS = { Salary:'💼', Freelance:'💻', Business:'🏪', Interest:'🏦', Rent:'🏠', Food:'🍔', Transport:'🚗', Shopping:'🛍️', Bills:'📱', EMI:'💳', Entertainment:'🎬', Health:'🏥', Education:'🎓', Other:'📌' };

export default function BudgetPage() {
  const router = useRouter();
  const [data, setData] = useState(null);
  const [mode, setMode] = useState('individual');
  const [showAdd, setShowAdd] = useState(false);
  const [txnType, setTxnType] = useState('expense');
  const [category, setCategory] = useState('Food');
  const [amount, setAmount] = useState('');
  const [desc, setDesc] = useState('');
  const [who, setWho] = useState('self');
  const [partnerName, setPartnerName] = useState('Partner');

  useEffect(() => { load(); }, []);

  async function load() {
    const [b, u, p] = await Promise.all([
      fetch('/api/budget').then(r => r.json()),
      fetch('/api/auth/me').then(r => r.json()),
      fetch('/api/profile').then(r => r.json())
    ]);
    if (u.error) { router.replace('/login'); return; }
    setData(b);
    setMode(u.user.mode);
    if (p.profile?.partner_name) setPartnerName(p.profile.partner_name);
  }

  async function addTxn() {
    if (!amount) return;
    await fetch('/api/budget', {
      method: 'POST', headers: {'Content-Type':'application/json'},
      body: JSON.stringify({ type: txnType, category, amount: Number(amount), description: desc, who })
    });
    setShowAdd(false);
    setAmount(''); setDesc('');
    load();
  }

  async function delTxn(id) {
    await fetch('/api/budget', { method: 'DELETE', headers: {'Content-Type':'application/json'}, body: JSON.stringify({ id }) });
    load();
  }

  if (!data) return <div style={{minHeight:'100vh',display:'flex',alignItems:'center',justifyContent:'center'}}><div className="spinner"></div></div>;

  const balance = data.totalIncome - data.totalExpense;

  return (
    <div className={mode === 'couple' ? 'couple-mode inner-page' : 'inner-page'}>
      <div className="is-header ish-budget">
        <Link href="/dashboard" className="is-back">← Back</Link>
        <div className="is-title">💸 Budget Tracker</div>
        <div className="is-sub">{mode === 'couple' ? 'Joint finances · Track together' : 'Income vs Spending'}</div>
      </div>
      <div className="scroller"><div className="is-body">
        <div className="budget-summary">
          <div className="budget-card income">
            <div className="budget-label">Income</div>
            <div className="budget-amount" style={{color:'var(--green)'}}>₹{data.totalIncome?.toLocaleString('en-IN')}</div>
          </div>
          <div className="budget-card expense">
            <div className="budget-label">Expenses</div>
            <div className="budget-amount" style={{color:'var(--red)'}}>₹{data.totalExpense?.toLocaleString('en-IN')}</div>
          </div>
        </div>
        <div className="stat-card" style={{textAlign:'center',marginBottom:16}}>
          <div className="budget-label">Balance</div>
          <div className="budget-amount" style={{color: balance >= 0 ? 'var(--green)' : 'var(--red)'}}>₹{Math.abs(balance).toLocaleString('en-IN')}</div>
        </div>

        <button className="add-txn-btn" onClick={() => setShowAdd(true)}>+ Add Transaction</button>

        {data.transactions?.length === 0 && <p style={{textAlign:'center',color:'var(--text2)',fontSize:13,padding:20}}>No transactions yet. Add your first one!</p>}
        {data.transactions?.map(t => (
          <div className="txn-item" key={t.id}>
            <div className="txn-ico">{CAT_ICONS[t.category] || '📌'}</div>
            <div className="txn-info">
              <div className="txn-cat">{t.category}{mode === 'couple' && <span className="txn-who">({t.who === 'self' ? 'You' : partnerName})</span>}</div>
              <div className="txn-desc">{t.description || t.date}</div>
            </div>
            <div className={`txn-amt ${t.type}`}>{t.type === 'income' ? '+' : '-'}₹{t.amount?.toLocaleString('en-IN')}</div>
            <button className="txn-del" onClick={() => delTxn(t.id)}>🗑️</button>
          </div>
        ))}
      </div></div>

      {showAdd && (
        <div className="modal-overlay" onClick={() => setShowAdd(false)}>
          <div className="modal-content" onClick={e => e.stopPropagation()}>
            <div className="modal-title">Add Transaction</div>
            <div className="seg-row" style={{marginBottom:14}}>
              <button className={`seg-btn ${txnType === 'income' ? 'on' : ''}`} onClick={() => { setTxnType('income'); setCategory('Salary'); }}>💰 Income</button>
              <button className={`seg-btn ${txnType === 'expense' ? 'on' : ''}`} onClick={() => { setTxnType('expense'); setCategory('Food'); }}>💸 Expense</button>
            </div>
            {mode === 'couple' && (
              <div className="who-tabs">
                <button className={`who-tab ${who === 'self' ? 'on' : ''}`} onClick={() => setWho('self')}>👤 You</button>
                <button className={`who-tab ${who === 'partner' ? 'on' : ''}`} onClick={() => setWho('partner')}>💕 {partnerName}</button>
              </div>
            )}
            <div className="frow"><div className="flabel">Category</div>
              <select className="finput" value={category} onChange={e => setCategory(e.target.value)}>
                {CATEGORIES[txnType].map(c => <option key={c} value={c}>{CAT_ICONS[c]} {c}</option>)}
              </select>
            </div>
            <div className="frow"><div className="flabel">Amount (₹)</div>
              <input className="finput" type="number" value={amount} onChange={e => setAmount(e.target.value)} placeholder="e.g. 5000" /></div>
            <div className="frow"><div className="flabel">Description (optional)</div>
              <input className="finput" value={desc} onChange={e => setDesc(e.target.value)} placeholder="e.g. Grocery shopping" /></div>
            <button className="action-btn" onClick={addTxn}>✓ Add</button>
          </div>
        </div>
      )}

      <BottomNav />
    </div>
  );
}
