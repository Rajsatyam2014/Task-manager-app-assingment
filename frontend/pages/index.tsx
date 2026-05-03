import { useEffect, useState } from 'react';
import { useRouter } from 'next/router';
import { request } from '../lib/api';
import type { User } from '../lib/types';

const defaultForm = { name: '', email: '', password: '' };

export default function HomePage() {
  const router = useRouter();
  const [isRegister, setIsRegister] = useState(false);
  const [form, setForm] = useState(defaultForm);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    if (typeof window === 'undefined') return;
    const token = localStorage.getItem('token');
    if (token) {
      router.replace('/dashboard');
    }
  }, [router]);

  const updateField = (field: string, value: string) => {
    setForm((current) => ({ ...current, [field]: value }));
    setError('');
  };

  const handleSubmit = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setLoading(true);
    setError('');

    try {
      const route = isRegister ? '/api/auth/register' : '/api/auth/login';
      const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:4001'}${route}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(form),
      });

      const result = await response.json();
      if (!response.ok) {
        throw new Error(result.message || 'Authentication failed');
      }

      localStorage.setItem('token', result.token);
      localStorage.setItem('user', JSON.stringify(result.user as User));
      router.replace('/dashboard');
    } catch (err) {
      setError(err instanceof Error ? err.message : 'An error occurred');
    } finally {
      setLoading(false);
    }
  };

  return (
    <main className="main-shell">
      <div className="page-header">
        <div>
          <h1 className="page-title">Team Task Manager</h1>
          <p className="small-text">Manage projects, invite teammates, and track tasks with ease.</p>
        </div>
        <button className="secondary" type="button" onClick={() => setIsRegister((current) => !current)}>
          {isRegister ? '← Back to login' : 'Create account →'}
        </button>
      </div>

      <div className="card" style={{ maxWidth: 480, margin: '0 auto' }}>
        <h2 style={{ marginTop: 0, marginBottom: 24, fontSize: '1.3rem' }}>
          {isRegister ? '✨ Create your account' : '🔐 Welcome back'}
        </h2>
        {error ? <div className="alert">{error}</div> : null}
        <form onSubmit={handleSubmit}>
          {isRegister ? (
            <div className="form-group">
              <label htmlFor="name">Name</label>
              <input
                id="name"
                value={form.name}
                onChange={(event) => updateField('name', event.target.value)}
                placeholder="Your name"
                required
                minLength={2}
              />
            </div>
          ) : null}

          <div className="form-group">
            <label htmlFor="email">Email address</label>
            <input
              id="email"
              type="email"
              value={form.email}
              onChange={(event) => updateField('email', event.target.value)}
              placeholder="team@company.com"
              required
            />
          </div>

          <div className="form-group">
            <label htmlFor="password">Password</label>
            <input
              id="password"
              type="password"
              value={form.password}
              onChange={(event) => updateField('password', event.target.value)}
              placeholder="Enter a secure password"
              minLength={6}
              required
            />
          </div>

          <button type="submit" className="primary" disabled={loading} style={{ width: '100%' }}>
            {loading ? '⏳ Working…' : isRegister ? '✓ Create account' : '→ Log in'}
          </button>
        </form>
      </div>
    </main>
  );
}
