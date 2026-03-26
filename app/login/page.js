'use client';
import { useState } from 'react';
import { useRouter } from 'next/navigation';

export default function Login() {
  const router = useRouter();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  async function handleLogin(e) {
    e.preventDefault();
    setError('');
    setLoading(true);
    try {
      const res = await fetch('/api/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, password })
      });
      const data = await res.json();
      if (data.error) { setError(data.error); setLoading(false); return; }
      router.push('/dashboard');
    } catch { setError('Network error'); setLoading(false); }
  }

  return (
    <div className="auth-page">
      <div className="auth-logo">Fin<span>Mate</span></div>
      <div className="auth-subtitle">Welcome back! Login to continue.</div>
      <div className="auth-card">
        <h2>Login</h2>
        <form onSubmit={handleLogin}>
          <div className="frow">
            <div className="flabel">Email</div>
            <input className="finput" type="email" value={email} onChange={e => setEmail(e.target.value)} placeholder="you@email.com" required />
          </div>
          <div className="frow">
            <div className="flabel">Password</div>
            <input className="finput" type="password" value={password} onChange={e => setPassword(e.target.value)} placeholder="••••••••" required />
          </div>
          {error && <div className="auth-error">{error}</div>}
          <button className="auth-btn" type="submit" disabled={loading}>{loading ? 'Logging in...' : 'Login →'}</button>
        </form>
      </div>
      <div className="auth-link">Don't have an account? <b onClick={() => router.push('/signup')}>Sign Up</b></div>
    </div>
  );
}
