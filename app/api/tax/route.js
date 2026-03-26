import { NextResponse } from 'next/server';
const { getDb } = require('@/lib/db');
const { getUserFromRequest } = require('@/lib/auth');

export async function POST(request) {
  const payload = getUserFromRequest(request);
  if (!payload) return NextResponse.json({ error: 'Not authenticated' }, { status: 401 });
  const db = getDb();
  const profile = db.prepare('SELECT * FROM profiles WHERE user_id = ?').get(payload.id);
  if (!profile) return NextResponse.json({ error: 'Profile not found' }, { status: 404 });

  const data = await request.json();
  const grossIncome = data.grossIncome || (profile.income * 12) || 900000;
  const basic = data.basic || profile.salary_basic || grossIncome * 0.5;
  const hra = data.hra || profile.salary_hra || grossIncome * 0.2;
  const special = data.special || profile.salary_special || grossIncome * 0.3;
  const inv80c = data.inv80c || profile.investments_80c || 0;
  const inv80d = data.inv80d || profile.investments_80d || 0;
  const nps = data.nps || profile.investments_nps || 0;
  const rentPaid = data.rentPaid || profile.hra_rent || 0;
  const city = data.city || profile.city || '';
  const isMetro = ['mumbai','delhi','kolkata','chennai','bangalore','bengaluru','hyderabad'].includes(city.toLowerCase());

  // Standard deduction
  const stdDeduction = 75000;

  // OLD REGIME
  let oldTaxable = grossIncome;
  oldTaxable -= stdDeduction;
  // 80C
  const ded80c = Math.min(inv80c, 150000);
  oldTaxable -= ded80c;
  // 80D
  const ded80d = Math.min(inv80d, 25000);
  oldTaxable -= ded80d;
  // NPS 80CCD(1B)
  const dedNps = Math.min(nps, 50000);
  oldTaxable -= dedNps;
  // HRA
  let hraExempt = 0;
  if (rentPaid > 0) {
    const hraRec = hra;
    const r1 = hraRec;
    const r2 = rentPaid - 0.1 * basic;
    const r3 = (isMetro ? 0.5 : 0.4) * basic;
    hraExempt = Math.max(0, Math.min(r1, r2, r3));
  }
  oldTaxable -= hraExempt;
  oldTaxable = Math.max(0, oldTaxable);

  // Old regime slabs (FY 2024-25)
  let oldTax = 0;
  if (oldTaxable > 1000000) oldTax += (oldTaxable - 1000000) * 0.30;
  if (oldTaxable > 500000) oldTax += Math.min(oldTaxable - 500000, 500000) * 0.20;
  if (oldTaxable > 250000) oldTax += Math.min(oldTaxable - 250000, 250000) * 0.05;
  oldTax += oldTax * 0.04; // cess

  // NEW REGIME (FY 2024-25)
  let newTaxable = grossIncome - stdDeduction;
  newTaxable = Math.max(0, newTaxable);
  let newTax = 0;
  const slabs = [
    [0, 400000, 0], [400000, 800000, 0.05], [800000, 1200000, 0.10],
    [1200000, 1600000, 0.15], [1600000, 2000000, 0.20],
    [2000000, 2400000, 0.25], [2400000, Infinity, 0.30]
  ];
  for (const [lo, hi, rate] of slabs) {
    if (newTaxable > lo) {
      newTax += Math.min(newTaxable - lo, hi - lo) * rate;
    }
  }
  // Rebate u/s 87A for new regime
  if (newTaxable <= 1200000) newTax = 0;
  newTax += newTax * 0.04; // cess

  const savings = Math.abs(Math.round(oldTax) - Math.round(newTax));
  const bestRegime = oldTax <= newTax ? 'old' : 'new';

  // Missing deductions
  const missing = [];
  if (inv80c < 150000) missing.push({ item: `₹${((150000 - inv80c)/1000).toFixed(0)}K ELSS/PPF not claimed under 80C`, saveable: Math.round((150000 - inv80c) * 0.2) });
  if (rentPaid === 0 && hra > 0) missing.push({ item: 'HRA not submitted — can save tax on rent', saveable: Math.round(hra * 0.3) });
  if (nps < 50000) missing.push({ item: `NPS 80CCD(1B) ₹${((50000 - nps)/1000).toFixed(0)}K deduction unused`, saveable: Math.round((50000 - nps) * 0.2) });
  if (inv80d < 25000) missing.push({ item: `Health insurance 80D ₹${((25000 - inv80d)/1000).toFixed(0)}K unused`, saveable: Math.round((25000 - inv80d) * 0.2) });

  return NextResponse.json({
    grossIncome: Math.round(grossIncome),
    oldTax: Math.round(oldTax),
    newTax: Math.round(newTax),
    savings,
    bestRegime,
    oldTaxable: Math.round(oldTaxable),
    newTaxable: Math.round(newTaxable),
    deductions: { std: stdDeduction, sec80c: ded80c, sec80d: ded80d, nps: dedNps, hra: Math.round(hraExempt) },
    missing
  });
}
