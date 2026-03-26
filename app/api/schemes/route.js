import { NextResponse } from 'next/server';
const { getDb } = require('@/lib/db');
const { getUserFromRequest } = require('@/lib/auth');

const SCHEMES = [
  { id: 'ppf', name: 'Public Provident Fund (PPF)', rate: '7.1%', lock: '15 years', min: 500, max: 150000, icon: '🏦', desc: 'Government-backed, tax-free returns under 80C. Best for long-term safe savings.', url: 'https://www.nsiindia.gov.in/InternalPage.aspx?Id_Pk=89' },
  { id: 'ssy', name: 'Sukanya Samriddhi Yojana', rate: '8.2%', lock: '21 years', min: 250, max: 150000, icon: '👧', desc: 'For girl child. Highest small savings rate with 80C benefit.', url: 'https://www.nsiindia.gov.in/InternalPage.aspx?Id_Pk=111' },
  { id: 'scss', name: 'Senior Citizen Savings Scheme', rate: '8.2%', lock: '5 years', min: 1000, max: 3000000, icon: '👴', desc: 'Best for 60+ citizens. Quarterly interest payout.', url: 'https://www.nsiindia.gov.in/InternalPage.aspx?Id_Pk=90' },
  { id: 'nsc', name: 'National Savings Certificate', rate: '7.7%', lock: '5 years', min: 1000, max: null, icon: '📜', desc: 'Fixed income certificate with 80C benefit. Fully government-backed.', url: 'https://www.nsiindia.gov.in/InternalPage.aspx?Id_Pk=91' },
  { id: 'po_td', name: 'Post Office Time Deposit', rate: '7.5%', lock: '1-5 years', min: 1000, max: null, icon: '🏤', desc: 'Like bank FD but from Post Office. 5-year TD gets 80C benefit.', url: 'https://www.nsiindia.gov.in/InternalPage.aspx?Id_Pk=88' },
  { id: 'po_rd', name: 'Post Office Recurring Deposit', rate: '6.7%', lock: '5 years', min: 100, max: null, icon: '📅', desc: 'Monthly investment with guaranteed returns. Great for building savings habit.', url: 'https://www.nsiindia.gov.in/InternalPage.aspx?Id_Pk=87' },
  { id: 'kvp', name: 'Kisan Vikas Patra', rate: '7.5%', lock: '115 months', min: 1000, max: null, icon: '🌾', desc: 'Doubles your money in ~9.5 years. No upper limit on investment.', url: 'https://www.nsiindia.gov.in/InternalPage.aspx?Id_Pk=92' },
  { id: 'mis', name: 'Monthly Income Scheme', rate: '7.4%', lock: '5 years', min: 1000, max: 900000, icon: '💵', desc: 'Monthly interest payout. Best for regular income needs.', url: 'https://www.nsiindia.gov.in/InternalPage.aspx?Id_Pk=93' },
  { id: 'nps', name: 'National Pension System (NPS)', rate: '9-12%', lock: 'Till 60', min: 500, max: null, icon: '🏛️', desc: 'Extra ₹50K deduction under 80CCD(1B). Market-linked pension fund.', url: 'https://www.npscra.nsdl.co.in/' },
  { id: 'elss', name: 'ELSS Mutual Fund', rate: '12-15%', lock: '3 years', min: 500, max: 150000, icon: '📈', desc: 'Tax saving with market returns. Shortest lock-in among 80C options.', url: 'https://www.amfiindia.com/' },
  { id: 'pm_jjby', name: 'PM Jeevan Jyoti Bima Yojana', rate: '₹436/yr', lock: '1 year', min: 436, max: 436, icon: '🛡️', desc: '₹2 Lakh life cover for just ₹436/year. Ages 18-55.', url: 'https://jansuraksha.gov.in/Forms-PMJJBY.aspx' },
  { id: 'atal', name: 'Atal Pension Yojana', rate: 'Guaranteed', lock: 'Till 60', min: 42, max: 1454, icon: '🏆', desc: 'Government pension of ₹1K-5K/month after 60. For ages 18-40.', url: 'https://jansuraksha.gov.in/Forms-APY.aspx' }
];

export async function GET(request) {
  const payload = getUserFromRequest(request);
  if (!payload) return NextResponse.json({ error: 'Not authenticated' }, { status: 401 });
  const db = getDb();
  const interests = db.prepare('SELECT * FROM scheme_interests WHERE user_id = ?').all(payload.id);
  const interestMap = {};
  for (const i of interests) interestMap[i.scheme_id] = { interested: i.interested, invest_amount: i.invest_amount };
  const schemes = SCHEMES.map(s => ({
    ...s,
    interested: interestMap[s.id]?.interested || 0,
    invest_amount: interestMap[s.id]?.invest_amount || 0
  }));
  return NextResponse.json({ schemes });
}

export async function POST(request) {
  const payload = getUserFromRequest(request);
  if (!payload) return NextResponse.json({ error: 'Not authenticated' }, { status: 401 });
  const { scheme_id, interested, invest_amount } = await request.json();
  const db = getDb();
  db.prepare(`INSERT INTO scheme_interests (user_id, scheme_id, interested, invest_amount) VALUES (?, ?, ?, ?) ON CONFLICT(user_id, scheme_id) DO UPDATE SET interested = excluded.interested, invest_amount = excluded.invest_amount`).run(payload.id, scheme_id, interested ? 1 : 0, invest_amount || 0);

  // If interested, update profile investments
  if (interested && invest_amount > 0) {
    const scheme = SCHEMES.find(s => s.id === scheme_id);
    if (scheme && ['ppf', 'nsc', 'elss', 'ssy'].includes(scheme_id)) {
      // Add to 80C investments
      const profile = db.prepare('SELECT investments_80c FROM profiles WHERE user_id = ?').get(payload.id);
      const total = db.prepare('SELECT SUM(invest_amount) as total FROM scheme_interests WHERE user_id = ? AND interested = 1 AND scheme_id IN (?, ?, ?, ?)').get(payload.id, 'ppf', 'nsc', 'elss', 'ssy');
      db.prepare('UPDATE profiles SET investments_80c = ? WHERE user_id = ?').run(Math.min(total.total || 0, 150000), payload.id);
    }
    if (scheme_id === 'nps') {
      db.prepare('UPDATE profiles SET investments_nps = ? WHERE user_id = ?').run(Math.min(invest_amount, 50000), payload.id);
    }
  }

  return NextResponse.json({ success: true });
}
