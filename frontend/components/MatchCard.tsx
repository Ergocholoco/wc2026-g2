'use client';
import { useState, useRef } from 'react';
import { Match, Prediction, savePrediction } from '@/lib/api';
import { teamFlag, teamName } from '@/lib/teams';

interface Props {
  match: Match;
  prediction?: Prediction;
  onSaved?: () => void;
}

export default function MatchCard({ match, prediction, onSaved }: Props) {
  const [home, setHome] = useState<string>(prediction?.home_score?.toString() ?? '');
  const [away, setAway] = useState<string>(prediction?.away_score?.toString() ?? '');
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);
  const debounce = useRef<ReturnType<typeof setTimeout> | null>(null);

  const locked = match.locked || prediction?.locked;
  const finished = match.status === 'FINISHED';

  function triggerSave(h: string, a: string) {
    if (locked) return;
    if (h === '' || a === '') return;
    const hNum = parseInt(h, 10);
    const aNum = parseInt(a, 10);
    if (isNaN(hNum) || isNaN(aNum) || hNum < 0 || aNum < 0) return;

    if (debounce.current) clearTimeout(debounce.current);
    debounce.current = setTimeout(async () => {
      setSaving(true);
      try {
        await savePrediction(match.id, hNum, aNum);
        setSaved(true);
        setTimeout(() => setSaved(false), 2000);
        onSaved?.();
      } catch {}
      setSaving(false);
    }, 800);
  }

  const scoreDisplay = finished && match.home_score != null
    ? `${match.home_score}–${match.away_score}`
    : null;

  return (
    <div style={{
      background: 'var(--surface)',
      border: '1px solid var(--surface2)',
      borderRadius: 'var(--radius)',
      padding: '0.75rem',
      opacity: locked && !finished ? 0.7 : 1,
    }}>
      <div style={{ fontSize: '0.7rem', color: 'var(--text-dim)', marginBottom: '0.5rem', display: 'flex', justifyContent: 'space-between' }}>
        <span>{match.kickoff_mt}</span>
        {locked && <span className="badge badge-locked">🔒 Locked</span>}
        {match.status === 'LIVE' || match.status === 'IN_PLAY'
          ? <span className="badge badge-live">● Live</span>
          : finished ? <span className="badge badge-done">Final</span> : null}
        {saving && <span style={{ color: 'var(--text-dim)', fontSize: '0.7rem' }}>saving…</span>}
        {saved && <span style={{ color: 'var(--green)', fontSize: '0.7rem' }}>✓ saved</span>}
      </div>

      <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
        <div style={{ flex: 1, textAlign: 'right' }}>
          <span style={{ fontSize: '1.5rem' }}>{teamFlag(match.home_team)}</span>
          <div style={{ fontSize: '0.75rem', color: 'var(--text-dim)', marginTop: '2px' }}>{teamName(match.home_team)}</div>
        </div>

        <div style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
          {finished && scoreDisplay ? (
            <div style={{ fontFamily: 'Barlow Condensed, sans-serif', fontWeight: 800, fontSize: '1.5rem', color: 'var(--gold)', minWidth: '60px', textAlign: 'center' }}>
              {scoreDisplay}
            </div>
          ) : (
            <>
              <input
                type="number" min="0" max="99"
                value={home}
                disabled={!!locked}
                onChange={e => { setHome(e.target.value); triggerSave(e.target.value, away); }}
                style={{ width: '44px', height: '44px', textAlign: 'center', fontSize: '1.2rem', fontWeight: 700, padding: 0 }}
              />
              <span style={{ color: 'var(--text-dim)', fontWeight: 700 }}>–</span>
              <input
                type="number" min="0" max="99"
                value={away}
                disabled={!!locked}
                onChange={e => { setAway(e.target.value); triggerSave(home, e.target.value); }}
                style={{ width: '44px', height: '44px', textAlign: 'center', fontSize: '1.2rem', fontWeight: 700, padding: 0 }}
              />
            </>
          )}
        </div>

        <div style={{ flex: 1, textAlign: 'left' }}>
          <span style={{ fontSize: '1.5rem' }}>{teamFlag(match.away_team)}</span>
          <div style={{ fontSize: '0.75rem', color: 'var(--text-dim)', marginTop: '2px' }}>{teamName(match.away_team)}</div>
        </div>
      </div>

      {locked && finished && prediction && (
        <div style={{ marginTop: '0.5rem', fontSize: '0.75rem', color: 'var(--text-dim)', textAlign: 'center' }}>
          Your pick: {prediction.home_score}–{prediction.away_score}
        </div>
      )}
    </div>
  );
}
