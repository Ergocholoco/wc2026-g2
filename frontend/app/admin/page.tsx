'use client';
import { useEffect, useState } from 'react';
import { getAdminPassword, setAdminPassword } from '@/lib/auth';
import {
  getAdminPlayers, createAdminPlayer, deleteAdminPlayer,
  getAdminPlayerPicks, triggerAdminRefresh,
} from '@/lib/api';

export default function AdminPage() {
  const [pw, setPwInput] = useState('');
  const [authed, setAuthed] = useState(false);
  const [players, setPlayers] = useState<any[]>([]);
  const [newName, setNewName] = useState('');
  const [newCode, setNewCode] = useState('');
  const [expandedId, setExpandedId] = useState<number | null>(null);
  const [expandedPicks, setExpandedPicks] = useState<any | null>(null);
  const [error, setError] = useState('');
  const [msg, setMsg] = useState('');

  useEffect(() => {
    if (getAdminPassword()) { setAuthed(true); loadPlayers(); }
  }, []);

  async function loadPlayers() {
    try { setPlayers(await getAdminPlayers()); }
    catch { setAuthed(false); }
  }

  async function handleLogin(e: React.FormEvent) {
    e.preventDefault();
    setAdminPassword(pw);
    try {
      await getAdminPlayers();
      setAuthed(true);
      loadPlayers();
    } catch {
      setError('Wrong password');
    }
  }

  async function handleAdd(e: React.FormEvent) {
    e.preventDefault();
    setError('');
    try {
      await createAdminPlayer(newName, newCode);
      setNewName(''); setNewCode('');
      await loadPlayers();
      setMsg('Player added');
    } catch (e: unknown) { setError(e instanceof Error ? e.message : String(e)); }
  }

  async function handleDelete(id: number, name: string) {
    if (!confirm(`Delete ${name}? All their picks will be removed.`)) return;
    await deleteAdminPlayer(id);
    await loadPlayers();
  }

  async function toggleExpand(id: number) {
    if (expandedId === id) { setExpandedId(null); setExpandedPicks(null); return; }
    setExpandedId(id);
    const picks = await getAdminPlayerPicks(id);
    setExpandedPicks(picks);
  }

  async function handleRefresh() {
    setMsg('');
    try { await triggerAdminRefresh(); setMsg('Poll cycle triggered'); }
    catch (e: unknown) { setError(e instanceof Error ? e.message : String(e)); }
  }

  if (!authed) {
    return (
      <div className="page" style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', paddingTop: '4rem' }}>
        <h1 className="condensed" style={{ color: 'var(--gold)', fontSize: '2rem', marginBottom: '1.5rem' }}>⚙️ Admin</h1>
        <form onSubmit={handleLogin} style={{ width: '100%', maxWidth: '300px' }}>
          <input type="password" value={pw} onChange={e => setPwInput(e.target.value)}
            placeholder="Admin password" style={{ width: '100%', padding: '0.75rem', marginBottom: '0.75rem', fontSize: '1rem' }} />
          {error && <p style={{ color: 'var(--red)', marginBottom: '0.5rem', fontSize: '0.85rem' }}>{error}</p>}
          <button type="submit" className="btn-gold" style={{ width: '100%' }}>Unlock</button>
        </form>
      </div>
    );
  }

  return (
    <div className="page">
      <h1 className="condensed" style={{ color: 'var(--gold)', fontSize: '2rem', marginBottom: '1rem' }}>⚙️ Admin</h1>

      {msg && <div style={{ color: 'var(--green)', marginBottom: '0.75rem', fontSize: '0.85rem' }}>{msg}</div>}
      {error && <div style={{ color: 'var(--red)', marginBottom: '0.75rem', fontSize: '0.85rem' }}>{error}</div>}

      <div style={{ background: 'var(--surface)', border: '1px solid var(--surface2)', borderRadius: 'var(--radius)', padding: '1rem', marginBottom: '1.5rem' }}>
        <div className="section-label" style={{ marginBottom: '0.5rem' }}>Add Player</div>
        <form onSubmit={handleAdd} style={{ display: 'flex', gap: '0.5rem', flexWrap: 'wrap' }}>
          <input value={newName} onChange={e => setNewName(e.target.value)} placeholder="Name"
            style={{ flex: '1 1 120px', padding: '0.5rem 0.75rem', fontSize: '0.9rem' }} />
          <input value={newCode} onChange={e => setNewCode(e.target.value)} placeholder="Access code"
            style={{ flex: '1 1 120px', padding: '0.5rem 0.75rem', fontSize: '0.9rem' }} />
          <button type="submit" className="btn-gold" style={{ padding: '0.5rem 1rem' }}>Add</button>
        </form>
      </div>

      <div style={{ display: 'flex', gap: '0.5rem', marginBottom: '1.5rem', flexWrap: 'wrap' }}>
        <button className="btn-ghost" onClick={handleRefresh}>↻ Refresh Scores</button>
        <a href="/api/admin/export.csv"
          style={{ display: 'inline-block', padding: '0.4rem 1rem', borderRadius: 'var(--radius)', border: '1px solid var(--surface2)', color: 'var(--text-dim)', fontSize: '0.875rem' }}
          download>
          ↓ Export CSV
        </a>
      </div>

      <div className="section-label" style={{ marginBottom: '0.5rem' }}>Players ({players.length})</div>
      <div style={{ display: 'flex', flexDirection: 'column', gap: '0.4rem' }}>
        {players.map(p => (
          <div key={p.id}>
            <div style={{
              background: 'var(--surface)', border: '1px solid var(--surface2)',
              borderRadius: 'var(--radius)', padding: '0.75rem',
              display: 'flex', alignItems: 'center', gap: '0.5rem',
            }}>
              <div style={{ flex: 1, minWidth: 0 }}>
                <div style={{ fontWeight: 600 }}>{p.name}</div>
                <div style={{ fontSize: '0.75rem', color: 'var(--text-dim)' }}>
                  Code: <code style={{ background: 'var(--surface2)', padding: '1px 5px', borderRadius: '4px' }}>{p.access_code}</code>
                  &nbsp;· {p.picks_count} picks · {p.total_points} pts
                </div>
              </div>
              <button className="btn-ghost" style={{ fontSize: '0.75rem', padding: '4px 8px' }}
                onClick={() => toggleExpand(p.id)}>
                {expandedId === p.id ? '▲ Hide' : '▼ Picks'}
              </button>
              <button onClick={() => handleDelete(p.id, p.name)}
                style={{ background: 'rgba(224,85,85,0.12)', border: '1px solid var(--red)', color: 'var(--red)', borderRadius: '6px', padding: '4px 8px', fontSize: '0.75rem' }}>
                Delete
              </button>
            </div>

            {expandedId === p.id && expandedPicks && (
              <div style={{ background: 'rgba(22,40,71,0.5)', border: '1px solid var(--surface2)', borderTop: 'none', borderRadius: '0 0 var(--radius) var(--radius)', padding: '0.75rem', fontSize: '0.8rem' }}>
                <div style={{ color: 'var(--text-dim)', marginBottom: '0.4rem' }}>
                  Predictions: {expandedPicks.predictions?.length ?? 0} · Bonus: {expandedPicks.bonus?.length ?? 0}
                </div>
                {expandedPicks.predictions?.slice(0, 5).map((pred: any) => (
                  <div key={pred.match_id} style={{ color: 'var(--text-dim)', lineHeight: '1.6' }}>
                    {pred.home_team} vs {pred.away_team}: {pred.home_score}–{pred.away_score}
                    {pred.status === 'FINISHED' ? ` (actual: ${pred.actual_home}–${pred.actual_away})` : ''}
                  </div>
                ))}
                {(expandedPicks.predictions?.length ?? 0) > 5 && (
                  <div style={{ color: 'var(--text-dim)' }}>… and {expandedPicks.predictions.length - 5} more</div>
                )}
              </div>
            )}
          </div>
        ))}
      </div>
    </div>
  );
}
