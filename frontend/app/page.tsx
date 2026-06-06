'use client';
import { useEffect, useState, useCallback } from 'react';
import { getPlayer } from '@/lib/auth';
import { getLeaderboard, LeaderboardEntry } from '@/lib/api';
import LoginGate from '@/components/LoginGate';
import LeaderboardCard from '@/components/LeaderboardCard';
import ScoringGuide from '@/components/ScoringGuide';

export default function Home() {
  const [player, setPlayerState] = useState<{ player_id: number; name: string } | null>(null);
  const [checked, setChecked] = useState(false);
  const [entries, setEntries] = useState<LeaderboardEntry[]>([]);
  const [lastUpdated, setLastUpdated] = useState<Date | null>(null);

  useEffect(() => {
    setPlayerState(getPlayer());
    setChecked(true);
  }, []);

  const load = useCallback(async () => {
    try {
      const data = await getLeaderboard();
      setEntries(data);
      setLastUpdated(new Date());
    } catch {}
  }, []);

  useEffect(() => {
    if (!player) return;
    load();
    const timer = setInterval(load, 30_000);
    return () => clearInterval(timer);
  }, [player, load]);

  if (!checked) return null;
  if (!player) return <LoginGate onLogin={() => setPlayerState(getPlayer())} />;

  return (
    <div className="page">
      <div style={{ display: 'flex', alignItems: 'baseline', justifyContent: 'space-between', marginBottom: '1rem' }}>
        <h1 className="condensed" style={{ fontSize: '2rem', color: 'var(--gold)' }}>
          🏆 Standings
        </h1>
        {lastUpdated && (
          <span style={{ fontSize: '0.7rem', color: 'var(--text-dim)' }}>
            Updated {lastUpdated.toLocaleTimeString()}
          </span>
        )}
      </div>

      {entries.length === 0 ? (
        <p style={{ color: 'var(--text-dim)', textAlign: 'center', marginTop: '3rem' }}>
          No players yet — admin needs to add players.
        </p>
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
          {entries.map(e => (
            <LeaderboardCard key={e.player_id} entry={e} isMe={e.player_id === player.player_id} />
          ))}
        </div>
      )}

      <ScoringGuide />
    </div>
  );
}
