import { NextResponse } from 'next/server';
const { getDb } = require('@/lib/db');
const { getUserFromRequest } = require('@/lib/auth');

export async function GET(request) {
  const payload = getUserFromRequest(request);
  if (!payload) return NextResponse.json({ error: 'Not authenticated' }, { status: 401 });
  const db = getDb();
  const profile = db.prepare('SELECT * FROM profiles WHERE user_id = ?').get(payload.id);
  const user = db.prepare('SELECT mode FROM users WHERE id = ?').get(payload.id);
  if (!profile) return NextResponse.json({ error: 'Profile not found' }, { status: 404 });

  const mf = profile.mutual_funds || 0;
  const stocks = profile.stocks || 0;
  const fd = profile.fd_ppf || 0;
  const gold = profile.gold || 0;
  let totalInvested = mf + stocks + fd + gold;

  if (user.mode === 'couple') {
    totalInvested += (profile.partner_mutual_funds || 0) + (profile.partner_stocks || 0) + (profile.partner_fd_ppf || 0) + (profile.partner_gold || 0);
  }

  const eqPct = totalInvested > 0 ? Math.round(((mf + stocks) / totalInvested) * 100) : 0;
  const debtPct = totalInvested > 0 ? Math.round((fd / totalInvested) * 100) : 0;
  const goldPct = totalInvested > 0 ? Math.round((gold / totalInvested) * 100) : 0;

  // Simulated analysis
  const overlap = mf > 0 && stocks > 0 ? Math.round(Math.random() * 20 + 15) : 0;
  const expenseRatio = mf > 0 ? (1.2 + Math.random() * 0.8).toFixed(1) : '0.0';
  const xirr = totalInvested > 0 ? (9 + Math.random() * 5).toFixed(1) : '0.0';
  const score = Math.min(100, Math.round(60 + (totalInvested / 10000) + (overlap < 20 ? 15 : 0) + (parseFloat(expenseRatio) < 1.5 ? 10 : 0)));

  const issues = [];
  if (overlap > 20) issues.push({ level: '🔴', text: `${overlap}% overlap in large-cap holdings` });
  if (parseFloat(expenseRatio) > 1.5) issues.push({ level: '🟠', text: `Expense ratio ${expenseRatio}% — switch to direct plans` });
  if (eqPct > 80) issues.push({ level: '🟡', text: 'Over-exposed to equity — consider adding debt' });
  if (goldPct > 20) issues.push({ level: '🟡', text: 'Gold allocation too high — consider rebalancing' });
  if (issues.length === 0) issues.push({ level: '🟢', text: 'Portfolio looks well balanced!' });

  const recommendations = [];
  if (overlap > 20) recommendations.push('Replace overlapping funds with a Nifty 50 Index Fund');
  if (parseFloat(expenseRatio) > 1.5) recommendations.push('Switch from regular to direct plans to save on fees');
  if (debtPct < 15) recommendations.push('Add 15-20% debt allocation for stability');
  if (recommendations.length === 0) recommendations.push('Continue your current investment strategy');

  return NextResponse.json({
    score, xirr, totalInvested, fundCount: (mf > 0 ? 1 : 0) + (stocks > 0 ? 1 : 0) + (fd > 0 ? 1 : 0) + (gold > 0 ? 1 : 0),
    overlap, expenseRatio, allocation: { equity: eqPct, debt: debtPct, gold: goldPct },
    issues, recommendations
  });
}
