'use client';
import { useState } from 'react';
import { useRouter } from 'next/navigation';

export default function Signup() {
  const router = useRouter();
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  async function handleSignup(e) {
    e.preventDefault();
    setError('');
    if (password.length < 6) { setError('Password must be at least 6 characters'); return; }
    setLoading(true);
    try {
      const res = await fetch('/api/auth/signup', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name, email, password })
      });
      const data = await res.json();
      if (data.error) { setError(data.error); setLoading(false); return; }
      router.push('/onboarding');
    } catch { setError('Network error'); setLoading(false); }
  }

  return (
    <div className="auth-page">
      <div className="auth-logo">Fin<span>Mate</span></div>
      <div className="auth-subtitle">Create your account to get started</div>
      <div className="auth-card">
        <h2>Sign Up</h2>
        <form onSubmit={handleSignup}>
          <div className="frow">
            <div className="flabel">Full Name</div>
            <input className="finput" type="text" value={name} onChange={e => setName(e.target.value)} placeholder="Rahul Sharma" required />
          </div>
          <div className="frow">
            <div className="flabel">Email</div>
            <input className="finput" type="email" value={email} onChange={e => setEmail(e.target.value)} placeholder="you@email.com" required />
          </div>
          <div className="frow">
            <div className="flabel">Password</div>
            <input className="finput" type="password" value={password} onChange={e => setPassword(e.target.value)} placeholder="Min 6 characters" required />
          </div>
          {error && <div className="auth-error">{error}</div>}
          <button className="auth-btn" type="submit" disabled={loading}>{loading ? 'Creating...' : 'Create Account →'}</button>
        </form>
      </div>
      <div className="auth-link">Already have an account? <b onClick={() => router.push('/login')}>Login</b></div>
    </div>
  );
}
