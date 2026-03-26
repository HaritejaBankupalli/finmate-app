import { NextResponse } from 'next/server';
const { getDb } = require('@/lib/db');
const { getUserFromRequest } = require('@/lib/auth');

export async function POST(request) {
  const payload = getUserFromRequest(request);
  if (!payload) return NextResponse.json({ error: 'Not authenticated' }, { status: 401 });
  const db = getDb();
  const profile = db.prepare('SELECT * FROM profiles WHERE user_id = ?').get(payload.id);
  const user = db.prepare('SELECT mode, partner_name FROM users WHERE id = ?').get(payload.id);
  if (!profile) return NextResponse.json({ error: 'Profile not found' }, { status: 404 });

  const age = profile.age || 28;
  const income = profile.income || 0;
  const expenses = profile.expenses || 0;
  const emi = profile.emi || 0;
  const savings = profile.savings || 0;
  const mf = profile.mutual_funds || 0;
  const stocks = profile.stocks || 0;
  const fd = profile.fd_ppf || 0;
  const gold = profile.gold || 0;
  const retYear = profile.retirement_year || 2045;
  const risk = profile.risk_level || 'moderate';
  const currentYear = new Date().getFullYear();

  // Current net worth
  let netWorth = mf + stocks + fd + gold;
  let totalIncome = income;
  let totalExpenses = expenses;
  let totalEmi = emi;

  // Couple mode adds partner
  if (user.mode === 'couple') {
    netWorth += (profile.partner_mutual_funds || 0) + (profile.partner_stocks || 0) + (profile.partner_fd_ppf || 0) + (profile.partner_gold || 0);
    totalIncome += profile.partner_income || 0;
    totalExpenses += profile.partner_expenses || 0;
    totalEmi += profile.partner_emi || 0;
  }

  const monthlySavings = totalIncome - totalExpenses - totalEmi;
  const yearsToRetire = retYear - currentYear;
  const retireAge = age + yearsToRetire;

  // Expected returns based on risk
  const rateMap = { conservative: 0.09, moderate: 0.12, aggressive: 0.15 };
  const annualRate = rateMap[risk] || 0.12;
  const monthlyRate = annualRate / 12;

  // FIRE corpus (25x annual expenses)
  const annualExpenses = (totalExpenses + totalEmi) * 12;
  const fireCorpus = annualExpenses * 25;

  // Monthly SIP needed
  const months = yearsToRetire * 12;
  let sipNeeded = 0;
  if (months > 0 && monthlyRate > 0) {
    const fvExisting = netWorth * Math.pow(1 + annualRate, yearsToRetire);
    const remaining = fireCorpus - fvExisting;
    if (remaining > 0) {
      sipNeeded = remaining * monthlyRate / (Math.pow(1 + monthlyRate, months) - 1);
    }
  }

  // Allocation based on risk
  const allocations = {
    conservative: { equity: 40, debt: 45, gold: 15 },
    moderate: { equity: 70, debt: 20, gold: 10 },
    aggressive: { equity: 85, debt: 10, gold: 5 }
  };
  const alloc = allocations[risk] || allocations.moderate;

  // Milestones
  const milestones = [];
  const milestoneYears = [1, 3, 5, 10, yearsToRetire];
  for (const yr of milestoneYears) {
    if (yr > yearsToRetire) continue;
    const fv = netWorth * Math.pow(1 + annualRate, yr) + (sipNeeded > 0 ? sipNeeded * ((Math.pow(1 + monthlyRate, yr * 12) - 1) / monthlyRate) : monthlySavings * ((Math.pow(1 + monthlyRate, yr * 12) - 1) / monthlyRate));
    let desc = '';
    if (yr === 1) desc = 'Start SIP + build emergency fund';
    else if (yr === 3) desc = 'Fully funded emergency corpus';
    else if (yr === 5) desc = 'Increase equity allocation';
    else if (yr === 10) desc = 'Review, rebalance, step-up SIP';
    else desc = 'FIRE achieved — retire comfortably!';
    milestones.push({ year: yr, netWorth: Math.round(fv), description: desc });
  }

  return NextResponse.json({
    retireAge: Math.round(retireAge),
    retireYear: retYear,
    yearsToGo: yearsToRetire,
    corpus: Math.round(fireCorpus),
    sipNeeded: Math.round(sipNeeded),
    xirr: (annualRate * 100).toFixed(1),
    currentNetWorth: Math.round(netWorth),
    allocation: alloc,
    milestones,
    monthlySavings: Math.round(monthlySavings),
    isCouple: user.mode === 'couple'
  });
}
