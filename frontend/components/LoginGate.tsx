'use client';
import { useState } from 'react';
import { login } from '@/lib/api';
import { setPlayer } from '@/lib/auth';

interface Props { onLogin: () => void; }

export default function LoginGate({ onLogin }: Props) {
  const [code, setCode] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError('');
    setLoading(true);
    try {
      const player = await login(code.trim().toLowerCase());
      setPlayer(player);
      onLogin();
    } catch {
      setError('Invalid access code. Try again.');
    } finally {
      setLoading(false);
    }
  }

  return (
    <div style={{
      minHeight: '100vh', display: 'flex', flexDirection: 'column',
      alignItems: 'center', justifyContent: 'center', padding: '2rem',
    }}>
      <div style={{ textAlign: 'center', marginBottom: '2rem' }}>
        <div style={{ fontSize: '4rem', marginBottom: '0.5rem' }}>🏆</div>
        <h1 style={{ fontSize: '2.5rem', color: 'var(--gold)', fontWeight: 800 }}>WC2026</h1>
        <p style={{ color: 'var(--text-dim)', marginTop: '0.25rem' }}>Office Pool</p>
      </div>

      <form onSubmit={handleSubmit} style={{
        width: '100%', maxWidth: '320px',
        background: 'var(--surface)', borderRadius: 'var(--radius)',
        padding: '1.5rem', border: '1px solid var(--surface2)',
      }}>
        <label style={{ display: 'block', marginBottom: '0.5rem', fontSize: '0.85rem', color: 'var(--text-dim)' }}>
          ACCESS CODE
        </label>
        <input
          type="text"
          value={code}
          onChange={e => setCode(e.target.value)}
          placeholder="Enter your code"
          autoComplete="off"
          spellCheck={false}
          style={{
            width: '100%', padding: '0.75rem 1rem',
            marginBottom: '1rem', fontSize: '1.1rem',
            background: 'var(--bg)', border: '1px solid var(--surface2)',
            borderRadius: '8px', color: 'var(--text)',
          }}
        />
        {error && (
          <p style={{ color: 'var(--red)', fontSize: '0.85rem', marginBottom: '0.75rem' }}>{error}</p>
        )}
        <button
          type="submit"
          disabled={loading || !code.trim()}
          className="btn-gold"
          style={{ width: '100%', opacity: loading || !code.trim() ? 0.6 : 1 }}
        >
          {loading ? 'Checking…' : 'Enter Pool'}
        </button>
      </form>
    </div>
  );
}
