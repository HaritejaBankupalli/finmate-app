import { NextResponse } from 'next/server';
const { getDb } = require('@/lib/db');
const { hashPassword, signToken } = require('@/lib/auth');

export async function POST(request) {
  try {
    const { name, email, password } = await request.json();
    if (!name || !email || !password) {
      return NextResponse.json({ error: 'Name, email, and password are required' }, { status: 400 });
    }
    const db = getDb();
    const existing = db.prepare('SELECT id FROM users WHERE email = ?').get(email);
    if (existing) {
      return NextResponse.json({ error: 'Email already registered' }, { status: 409 });
    }
    const password_hash = await hashPassword(password);
    const result = db.prepare('INSERT INTO users (name, email, password_hash) VALUES (?, ?, ?)').run(name, email, password_hash);
    const userId = result.lastInsertRowid;
    db.prepare('INSERT INTO profiles (user_id) VALUES (?)').run(userId);
    // Create default notifications
    db.prepare("INSERT INTO notifications (user_id, title, message, type) VALUES (?, 'Welcome to FinMate!', 'Complete your profile to get personalized financial advice.', 'info')").run(userId);
    const token = signToken({ id: userId, email, name });
    const response = NextResponse.json({ success: true, user: { id: userId, name, email } });
    response.cookies.set('token', token, { httpOnly: true, secure: false, sameSite: 'lax', path: '/', maxAge: 7 * 24 * 60 * 60 });
    return response;
  } catch (err) {
    return NextResponse.json({ error: 'Server error: ' + err.message }, { status: 500 });
  }
}
