import { useEffect, useState } from 'react';
import { useRouter } from 'next/router';
import { request } from '../lib/api';
import type { User } from '../lib/types';
import { motion } from 'framer-motion';

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
      window.location.href = '/dashboard';
    } catch (err) {
      setError(err instanceof Error ? err.message : 'An error occurred');
    } finally {
      setLoading(false);
    }
  };

  return (
    <motion.div 
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -20 }}
      transition={{ duration: 0.4 }}
      style={{ width: '100%', maxWidth: 440 }}
    >
      <div style={{ textAlign: 'center', marginBottom: 40 }}>
        <div style={{ width: 64, height: 64, borderRadius: 16, background: 'var(--accent-gradient)', display: 'inline-flex', alignItems: 'center', justifyContent: 'center', fontWeight: 'bold', color: 'white', fontSize: '2rem', marginBottom: 24, boxShadow: '0 8px 32px rgba(47,129,247,0.3)' }}>
          E
        </div>
        <h1 className="gradient-text" style={{ fontSize: '2.5rem', marginBottom: 8 }}>Ethara AI</h1>
        <p className="small-text" style={{ fontSize: '1rem' }}>The agile project management tool for modern teams.</p>
      </div>

      <div className="glass-panel" style={{ padding: 32 }}>
        <h2 style={{ fontSize: '1.25rem', marginBottom: 24, textAlign: 'center' }}>
          {isRegister ? 'Create your workspace' : 'Sign in to Ethara AI'}
        </h2>
        
        {error ? <div className="alert">{error}</div> : null}
        
        <form onSubmit={handleSubmit}>
          {isRegister && (
            <motion.div initial={{ height: 0, opacity: 0 }} animate={{ height: 'auto', opacity: 1 }} className="form-group">
              <label htmlFor="name">Full Name</label>
              <input
                id="name"
                value={form.name}
                onChange={(event) => updateField('name', event.target.value)}
                placeholder="Jane Doe"
                required
                minLength={2}
              />
            </motion.div>
          )}

          <div className="form-group">
            <label htmlFor="email">Work Email</label>
            <input
              id="email"
              type="email"
              value={form.email}
              onChange={(event) => updateField('email', event.target.value)}
              placeholder="name@company.com"
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
              placeholder="••••••••"
              minLength={6}
              required
            />
          </div>

          <button type="submit" className="btn btn-primary" disabled={loading} style={{ width: '100%', marginTop: 16, padding: '12px' }}>
            {loading ? 'Authenticating...' : isRegister ? 'Create Account' : 'Sign In'}
          </button>
        </form>
      </div>

      <div style={{ textAlign: 'center', marginTop: 24 }}>
        <button className="btn" style={{ color: 'var(--text-secondary)' }} type="button" onClick={() => setIsRegister((current) => !current)}>
          {isRegister ? 'Already have an account? Sign in' : "Don't have an account? Sign up"}
        </button>
      </div>
    </motion.div>
  );
}
