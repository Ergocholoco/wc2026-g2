'use client';
import { useEffect, useState } from 'react';
import { getConfig, AppConfig } from '@/lib/api';

const STANDARD_MATCH = [
  { pts: 2, label: 'Result',      desc: 'Right winner or draw' },
  { pts: 5, label: 'Exact score', desc: 'Both teams\' goals match exactly' },
];

const ADVANCED_MATCH = [
  { pts: 4, label: 'Correct outcome',      desc: 'Right winner or draw' },
  { pts: 6, label: '+ winner\'s goals',    desc: 'Correct outcome + right goals for the winning team' },
  { pts: 6, label: '+ loser\'s goals',     desc: 'Correct outcome + right goals for the losing team' },
  { pts: 8, label: 'Exact score (max)',    desc: 'Correct outcome + both teams\' goals exactly right' },
];

const STANDARD_BONUS = [
  { pts: 25, label: 'Champion',         desc: '1 pick — the team that wins the tournament' },
  { pts: 15, label: 'Finalist',         desc: '2 picks — teams you think reach the final (either order)' },
  { pts: 12, label: '3rd place',        desc: '1 pick — winner of the 3rd place match' },
  { pts: 10, label: 'Semifinalist',     desc: '4 picks — teams you think reach the semis' },
  { pts: 6,  label: 'Quarterfinalist',  desc: '8 picks — teams you think reach the quarters' },
  { pts: 4,  label: 'Group winner',     desc: '12 picks — who finishes 1st in each group' },
  { pts: 2,  label: 'Group runner-up',  desc: '12 picks — who finishes 2nd in each group' },
];

const ADVANCED_BONUS = [
  { pts: 20, label: 'World Cup Winner', desc: '1 pick — the champion' },
  { pts: 15, label: 'Runner-up',        desc: '1 pick — team that finishes 2nd' },
  { pts: 10, label: '3rd place',        desc: '1 pick — team that finishes 3rd' },
  { pts: 5,  label: '4th place',        desc: '1 pick — team that finishes 4th' },
  { pts: 2,  label: 'Round of 16 team', desc: '16 picks — teams you think advance past the Round of 32' },
];

function fmt(n: number | null) {
  return n != null ? `$${n}` : null;
}

export default function ScoringGuide() {
  const [open, setOpen] = useState(false);
  const [config, setConfig] = useState<AppConfig | null>(null);

  useEffect(() => {
    getConfig().then(setConfig).catch(console.error);
  }, []);

  const isAdvanced = config?.scoringMode === 'advanced';
  const matchRules = isAdvanced ? ADVANCED_MATCH : STANDARD_MATCH;
  const bonusRules = isAdvanced ? ADVANCED_BONUS : STANDARD_BONUS;
  const { prizes } = config ?? { prizes: { first: null, second: null, third: null, entryFee: null } };
  const hasPrizes = prizes && (prizes.first != null || prizes.second != null || prizes.third != null);

  return (
    <div style={{ marginTop: '2rem', borderTop: '1px solid var(--surface2)', paddingTop: '1rem' }}>
      <button
        onClick={() => setOpen(o => !o)}
        style={{
          background: 'none', border: 'none', cursor: 'pointer',
          display: 'flex', alignItems: 'center', gap: '0.5rem',
          color: 'var(--text-dim)', fontSize: '0.85rem', padding: 0, width: '100%',
        }}
      >
        <span style={{ fontSize: '1rem' }}>📋</span>
        <span style={{ fontWeight: 600 }}>How scoring works</span>
        <span style={{ marginLeft: 'auto', fontSize: '0.75rem' }}>{open ? '▲ hide' : '▼ show'}</span>
      </button>

      {open && (
        <div style={{ marginTop: '0.75rem', display: 'flex', flexDirection: 'column', gap: '1rem' }}>

          {/* Match picks */}
          <div>
            <div className="section-label" style={{ marginBottom: '0.4rem' }}>Match predictions</div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.3rem' }}>
              {matchRules.map(r => (
                <div key={r.label} style={{
                  background: 'var(--surface)', border: '1px solid var(--surface2)',
                  borderRadius: 'var(--radius)', padding: '0.5rem 0.75rem',
                  display: 'flex', alignItems: 'center', gap: '0.75rem',
                }}>
                  <span style={{
                    fontFamily: 'Barlow Condensed, sans-serif', fontWeight: 800,
                    fontSize: '1.1rem', color: 'var(--gold)', minWidth: '36px', textAlign: 'center',
                  }}>
                    {r.pts}
                  </span>
                  <div>
                    <div style={{ fontSize: '0.85rem', fontWeight: 600 }}>{r.label}</div>
                    <div style={{ fontSize: '0.72rem', color: 'var(--text-dim)' }}>{r.desc}</div>
                  </div>
                </div>
              ))}
              {isAdvanced && (
                <div style={{
                  background: 'rgba(240,165,0,0.07)', border: '1px solid rgba(240,165,0,0.2)',
                  borderRadius: 'var(--radius)', padding: '0.4rem 0.75rem',
                  fontSize: '0.78rem', color: 'var(--text-dim)',
                }}>
                  💡 Points are additive — correct outcome (4) + both goal tallies (2+2) = <strong style={{ color: 'var(--gold)' }}>8 pts max</strong>
                </div>
              )}
            </div>
          </div>

          {/* Bonus picks */}
          <div>
            <div className="section-label" style={{ marginBottom: '0.4rem' }}>Bonus picks</div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.3rem' }}>
              {bonusRules.map(r => (
                <div key={r.label} style={{
                  background: 'var(--surface)', border: '1px solid var(--surface2)',
                  borderRadius: 'var(--radius)', padding: '0.5rem 0.75rem',
                  display: 'flex', alignItems: 'center', gap: '0.75rem',
                }}>
                  <span style={{
                    fontFamily: 'Barlow Condensed, sans-serif', fontWeight: 800,
                    fontSize: '1.1rem', color: 'var(--gold)', minWidth: '36px', textAlign: 'center',
                  }}>
                    +{r.pts}
                  </span>
                  <div>
                    <div style={{ fontSize: '0.85rem', fontWeight: 600 }}>{r.label}</div>
                    <div style={{ fontSize: '0.72rem', color: 'var(--text-dim)' }}>{r.desc}</div>
                  </div>
                </div>
              ))}
            </div>
            <div style={{
              marginTop: '0.3rem',
              background: 'rgba(240,165,0,0.07)', border: '1px solid rgba(240,165,0,0.2)',
              borderRadius: 'var(--radius)', padding: '0.4rem 0.75rem',
              fontSize: '0.78rem', color: 'var(--text-dim)',
            }}>
              💡 Each correct bonus pick scores independently
            </div>
          </div>

          {/* Prizes */}
          {hasPrizes && (
            <div>
              <div className="section-label" style={{ marginBottom: '0.4rem' }}>Prizes</div>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '0.3rem' }}>
                {prizes.entryFee != null && (
                  <div style={{
                    background: 'var(--surface)', border: '1px solid var(--surface2)',
                    borderRadius: 'var(--radius)', padding: '0.5rem 0.75rem',
                    display: 'flex', alignItems: 'center', gap: '0.75rem',
                  }}>
                    <span style={{ fontSize: '1.1rem', minWidth: '36px', textAlign: 'center' }}>🎟️</span>
                    <div>
                      <div style={{ fontSize: '0.85rem', fontWeight: 600 }}>Entry fee</div>
                      <div style={{ fontSize: '0.72rem', color: 'var(--text-dim)' }}>{fmt(prizes.entryFee)} per person</div>
                    </div>
                  </div>
                )}
                {[
                  { place: '🥇 1st place', amount: prizes.first },
                  { place: '🥈 2nd place', amount: prizes.second },
                  { place: '🥉 3rd place', amount: prizes.third },
                ].filter(p => p.amount != null).map(p => (
                  <div key={p.place} style={{
                    background: 'var(--surface)', border: '1px solid var(--surface2)',
                    borderRadius: 'var(--radius)', padding: '0.5rem 0.75rem',
                    display: 'flex', alignItems: 'center', justifyContent: 'space-between',
                  }}>
                    <span style={{ fontSize: '0.85rem', fontWeight: 600 }}>{p.place}</span>
                    <span style={{
                      fontFamily: 'Barlow Condensed, sans-serif', fontWeight: 800,
                      fontSize: '1.1rem', color: 'var(--gold)',
                    }}>{fmt(p.amount)}</span>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Lock note */}
          <div style={{
            background: 'rgba(255,255,255,0.04)', borderRadius: 'var(--radius)',
            padding: '0.5rem 0.75rem', fontSize: '0.78rem', color: 'var(--text-dim)',
          }}>
            🔒 Predictions lock <strong>1 hour before kickoff</strong>. Bonus picks lock before the first match of each round.
          </div>

        </div>
      )}
    </div>
  );
}
