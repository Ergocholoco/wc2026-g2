'use client';
import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { getPlayer } from '@/lib/auth';
import { getMatches, getPredictions, Match, Prediction } from '@/lib/api';
import PhaseTabs from '@/components/PhaseTabs';
import MatchCard from '@/components/MatchCard';
import BonusPicksForm from '@/components/BonusPicksForm';

export default function PicksPage() {
  const router = useRouter();
  const [player, setPlayer] = useState<{ player_id: number; name: string } | null>(null);
  const [phase, setPhase] = useState('group_a');
  const [matches, setMatches] = useState<Match[]>([]);
  const [predictions, setPredictions] = useState<Prediction[]>([]);

  useEffect(() => {
    const p = getPlayer();
    if (!p) { router.push('/'); return; }
    setPlayer(p);
  }, [router]);

  useEffect(() => {
    if (!player || phase === 'bonus') return;
    getMatches(phase).then(setMatches).catch(console.error);
  }, [player, phase]);

  useEffect(() => {
    if (!player) return;
    getPredictions(player.player_id).then(setPredictions).catch(console.error);
  }, [player]);

  if (!player) return null;

  const predMap = new Map(predictions.map(p => [p.match_id, p]));

  return (
    <div className="page">
      <h1 className="condensed" style={{ fontSize: '2rem', color: 'var(--gold)', marginBottom: '1rem' }}>
        ⚽ My Picks
      </h1>
      <PhaseTabs active={phase} onChange={setPhase} />

      {phase === 'bonus' ? (
        <BonusPicksForm player={player} />
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
          {matches.length === 0 && (
            <p style={{ color: 'var(--text-dim)', textAlign: 'center', marginTop: '2rem' }}>
              No matches for this phase yet.
            </p>
          )}
          {matches.map(m => (
            <MatchCard
              key={m.id}
              match={m}
              prediction={predMap.get(m.id)}
              onSaved={() => getPredictions(player.player_id).then(setPredictions)}
            />
          ))}
        </div>
      )}
    </div>
  );
}
