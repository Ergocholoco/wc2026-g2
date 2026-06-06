'use client';
import { useEffect, useState } from 'react';
import { getMatches, Match } from '@/lib/api';
import { teamFlag, teamName } from '@/lib/teams';

function statusBadge(m: Match) {
  if (m.status === 'FINISHED') return <span className="badge badge-done">Final</span>;
  if (m.status === 'LIVE' || m.status === 'IN_PLAY' || m.status === 'PAUSED')
    return <span className="badge badge-live">● Live</span>;
  if (m.status === 'POSTPONED') return <span className="badge" style={{ background: 'rgba(224,85,85,0.12)', color: 'var(--red)' }}>Postponed</span>;
  if (m.locked) return <span className="badge badge-locked">🔒 Locked</span>;
  return <span className="badge badge-sched">Scheduled</span>;
}

function dateKey(kickoff_mt: string) {
  return kickoff_mt.split(',')[0];
}

export default function SchedulePage() {
  const [matches, setMatches] = useState<Match[]>([]);

  useEffect(() => {
    getMatches().then(setMatches).catch(console.error);
    const t = setInterval(() => getMatches().then(setMatches).catch(console.error), 5 * 60_000);
    return () => clearInterval(t);
  }, []);

  const byDate = new Map<string, Match[]>();
  for (const m of matches) {
    const key = dateKey(m.kickoff_mt);
    if (!byDate.has(key)) byDate.set(key, []);
    byDate.get(key)!.push(m);
  }

  return (
    <div className="page">
      <h1 className="condensed" style={{ fontSize: '2rem', color: 'var(--gold)', marginBottom: '1rem' }}>
        📅 Schedule
      </h1>

      {[...byDate.entries()].map(([date, ms]) => (
        <div key={date} style={{ marginBottom: '1.25rem' }}>
          <div className="section-label">{date}</div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '0.4rem', marginTop: '0.4rem' }}>
            {ms.map(m => (
              <div key={m.id} style={{
                background: 'var(--surface)', border: '1px solid var(--surface2)',
                borderRadius: 'var(--radius)', padding: '0.6rem 0.75rem',
                display: 'flex', alignItems: 'center', gap: '0.5rem',
              }}>
                <div style={{ flex: 1, display: 'flex', alignItems: 'center', gap: '6px', justifyContent: 'flex-end' }}>
                  <span style={{ fontSize: '0.8rem', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', maxWidth: '80px' }}>{teamName(m.home_team)}</span>
                  <span style={{ fontSize: '1.2rem' }}>{teamFlag(m.home_team)}</span>
                </div>

                <div style={{ textAlign: 'center', minWidth: '70px' }}>
                  {m.status === 'FINISHED' && m.home_score != null ? (
                    <span style={{ fontFamily: 'Barlow Condensed, sans-serif', fontWeight: 800, fontSize: '1.1rem', color: 'var(--gold)' }}>
                      {m.home_score}–{m.away_score}
                    </span>
                  ) : (
                    <span style={{ fontSize: '0.75rem', color: 'var(--text-dim)' }}>
                      {m.kickoff_mt.split(', ')[1]}
                    </span>
                  )}
                </div>

                <div style={{ flex: 1, display: 'flex', alignItems: 'center', gap: '6px' }}>
                  <span style={{ fontSize: '1.2rem' }}>{teamFlag(m.away_team)}</span>
                  <span style={{ fontSize: '0.8rem', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', maxWidth: '80px' }}>{teamName(m.away_team)}</span>
                </div>

                <div style={{ flexShrink: 0 }}>{statusBadge(m)}</div>
              </div>
            ))}
          </div>
        </div>
      ))}
    </div>
  );
}
