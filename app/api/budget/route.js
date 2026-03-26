import { NextResponse } from 'next/server';
const { getDb } = require('@/lib/db');
const { getUserFromRequest } = require('@/lib/auth');

export async function GET(request) {
  const payload = getUserFromRequest(request);
  if (!payload) return NextResponse.json({ error: 'Not authenticated' }, { status: 401 });
  const db = getDb();
  const txns = db.prepare('SELECT * FROM transactions WHERE user_id = ? ORDER BY date DESC LIMIT 50').all(payload.id);
  const income = db.prepare("SELECT COALESCE(SUM(amount),0) as total FROM transactions WHERE user_id = ? AND type = 'income'").get(payload.id);
  const expense = db.prepare("SELECT COALESCE(SUM(amount),0) as total FROM transactions WHERE user_id = ? AND type = 'expense'").get(payload.id);
  return NextResponse.json({ transactions: txns, totalIncome: income.total, totalExpense: expense.total });
}

export async function POST(request) {
  const payload = getUserFromRequest(request);
  if (!payload) return NextResponse.json({ error: 'Not authenticated' }, { status: 401 });
  const { type, category, amount, description, who, date } = await request.json();
  if (!type || !category || !amount) return NextResponse.json({ error: 'type, category and amount are required' }, { status: 400 });
  const db = getDb();
  db.prepare('INSERT INTO transactions (user_id, type, category, amount, description, who, date) VALUES (?, ?, ?, ?, ?, ?, ?)').run(payload.id, type, category, amount, description || '', who || 'self', date || new Date().toISOString().split('T')[0]);
  return NextResponse.json({ success: true });
}

export async function DELETE(request) {
  const payload = getUserFromRequest(request);
  if (!payload) return NextResponse.json({ error: 'Not authenticated' }, { status: 401 });
  const { id } = await request.json();
  const db = getDb();
  db.prepare('DELETE FROM transactions WHERE id = ? AND user_id = ?').run(id, payload.id);
  return NextResponse.json({ success: true });
}
