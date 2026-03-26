import { NextResponse } from 'next/server';
const { getDb } = require('@/lib/db');
const { getUserFromRequest } = require('@/lib/auth');

export async function GET(request) {
  const payload = getUserFromRequest(request);
  if (!payload) return NextResponse.json({ error: 'Not authenticated' }, { status: 401 });
  const db = getDb();
  const profile = db.prepare('SELECT * FROM profiles WHERE user_id = ?').get(payload.id);
  const user = db.prepare('SELECT name, email, mode, partner_name FROM users WHERE id = ?').get(payload.id);
  return NextResponse.json({ profile: { ...profile, ...user } });
}

export async function PUT(request) {
  const payload = getUserFromRequest(request);
  if (!payload) return NextResponse.json({ error: 'Not authenticated' }, { status: 401 });
  const data = await request.json();
  const db = getDb();

  // Update user fields
  if (data.mode !== undefined) {
    db.prepare('UPDATE users SET mode = ? WHERE id = ?').run(data.mode, payload.id);
  }
  if (data.partner_name !== undefined) {
    db.prepare('UPDATE users SET partner_name = ? WHERE id = ?').run(data.partner_name, payload.id);
  }
  if (data.name !== undefined) {
    db.prepare('UPDATE users SET name = ? WHERE id = ?').run(data.name, payload.id);
  }

  // Update profile fields
  const profileFields = [
    'age','income','expenses','emi','savings','city','risk_level','goals',
    'mutual_funds','stocks','fd_ppf','gold','retirement_year',
    'partner_age','partner_income','partner_expenses','partner_emi','partner_savings',
    'partner_mutual_funds','partner_stocks','partner_fd_ppf','partner_gold',
    'salary_basic','salary_hra','salary_special','salary_lta',
    'investments_80c','investments_80d','investments_nps','hra_rent'
  ];
  const updates = [];
  const values = [];
  for (const f of profileFields) {
    if (data[f] !== undefined) {
      updates.push(`${f} = ?`);
      values.push(data[f]);
    }
  }
  if (updates.length > 0) {
    values.push(payload.id);
    db.prepare(`UPDATE profiles SET ${updates.join(', ')} WHERE user_id = ?`).run(...values);
  }

  const profile = db.prepare('SELECT * FROM profiles WHERE user_id = ?').get(payload.id);
  const user = db.prepare('SELECT name, email, mode, partner_name FROM users WHERE id = ?').get(payload.id);
  return NextResponse.json({ success: true, profile: { ...profile, ...user } });
}
