import { NextResponse } from 'next/server';
const { getDb } = require('@/lib/db');
const { comparePassword, signToken } = require('@/lib/auth');

export async function POST(request) {
  try {
    const { email, password } = await request.json();
    if (!email || !password) {
      return NextResponse.json({ error: 'Email and password are required' }, { status: 400 });
    }
    const db = getDb();
    const user = db.prepare('SELECT * FROM users WHERE email = ?').get(email);
    if (!user) {
      return NextResponse.json({ error: 'Invalid email or password' }, { status: 401 });
    }
    const valid = comparePassword(password, user.password_hash);
    if (!valid) {
      return NextResponse.json({ error: 'Invalid email or password' }, { status: 401 });
    }
    const token = signToken({ id: user.id, email: user.email, name: user.name });
    const response = NextResponse.json({ success: true, user: { id: user.id, name: user.name, email: user.email, mode: user.mode } });
    response.cookies.set('token', token, { httpOnly: true, secure: false, sameSite: 'lax', path: '/', maxAge: 7 * 24 * 60 * 60 });
    return response;
  } catch (err) {
    return NextResponse.json({ error: 'Server error: ' + err.message }, { status: 500 });
  }
}
