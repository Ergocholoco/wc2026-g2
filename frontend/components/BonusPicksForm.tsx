'use client';
import { useEffect, useState } from 'react';
import { getBonusPicks, saveBonusPick, BonusPick } from '@/lib/api';

const ALL_TEAMS = [
  'ARG','AUS','BEL','BRA','CAN','CMR','COL','CRC','CRO','DEN',
  'ECU','EGY','ENG','ESP','FRA','GER','GHA','HUN','IRN','IRQ',
  'ITA','JPN','JOR','KOR','MAR','MEX','NED','NGA','NZL','PAN',
  'POL','POR','RSA','SAU','SCO','SEN','SRB','SUI','TUR','URU',
  'USA','VEN','ALB','AUT','BIH','BOL','CHI','CHN','CIV','CZE',
];

const GROUPS = ['a','b','c','d','e','f','g','h','i','j','k','l'];

interface BonusSection {
  title: string;
  picks: { pick_type: string; label: string }[];
}

const SECTIONS: BonusSection[] = [
  {
    title: '🏆 Knockout Picks',
    picks: [
      { pick_type: 'champion', label: 'Champion' },
      { pick_type: 'third_place', label: '3rd Place' },
      { pick_type: 'finalist_1', label: 'Finalist 1' },
      { pick_type: 'finalist_2', label: 'Finalist 2' },
      { pick_type: 'semifinalist_1', label: 'Semifinalist 1' },
      { pick_type: 'semifinalist_2', label: 'Semifinalist 2' },
      { pick_type: 'semifinalist_3', label: 'Semifinalist 3' },
      { pick_type: 'semifinalist_4', label: 'Semifinalist 4' },
      ...Array.from({ length: 8 }, (_, i) => ({
        pick_type: `quarterfinalist_${i + 1}`,
        label: `Quarterfinalist ${i + 1}`,
      })),
    ],
  },
  {
    title: '📊 Group Winners',
    picks: GROUPS.flatMap(g => [
      { pick_type: `group_${g}_1st`, label: `Group ${g.toUpperCase()} — 1st` },
      { pick_type: `group_${g}_2nd`, label: `Group ${g.toUpperCase()} — 2nd` },
    ]),
  },
];

interface Props { player: { player_id: number; name: string }; }

export default function BonusPicksForm({ player }: Props) {
  const [picks, setPicks] = useState<BonusPick[]>([]);
  const [saving, setSaving] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    getBonusPicks(player.player_id).then(setPicks).catch(console.error);
  }, [player.player_id]);

  const pickMap = new Map(picks.map(p => [p.pick_type, p]));

  async function handleChange(pick_type: string, team_code: string) {
    if (!team_code) return;
    setSaving(pick_type);
    setError(null);
    try {
      await saveBonusPick(pick_type, team_code);
      const updated = await getBonusPicks(player.player_id);
      setPicks(updated);
    } catch (e: unknown) {
      setError(e instanceof Error ? e.message : String(e));
    } finally {
      setSaving(null);
    }
  }

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
      {error && (
        <div style={{ background: 'rgba(224,85,85,0.1)', border: '1px solid var(--red)', borderRadius: 'var(--radius)', padding: '0.75rem', color: 'var(--red)', fontSize: '0.85rem' }}>
          {error}
        </div>
      )}

      {SECTIONS.map(section => (
        <div key={section.title}>
          <div className="section-label" style={{ marginBottom: '0.5rem' }}>{section.title}</div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '0.4rem' }}>
            {section.picks.map(({ pick_type, label }) => {
              const existing = pickMap.get(pick_type);
              const isLocked = existing?.locked;
              return (
                <div key={pick_type} style={{
                  display: 'flex', alignItems: 'center', gap: '0.75rem',
                  background: 'var(--surface)', borderRadius: '8px',
                  padding: '0.5rem 0.75rem',
                  border: '1px solid var(--surface2)',
                  opacity: isLocked ? 0.6 : 1,
                }}>
                  <label style={{ flex: 1, fontSize: '0.85rem', color: 'var(--text-dim)' }}>
                    {label}{isLocked && ' 🔒'}
                  </label>
                  <select
                    disabled={!!isLocked}
                    value={existing?.team_code ?? ''}
                    onChange={e => handleChange(pick_type, e.target.value)}
                    style={{ padding: '4px 8px', fontSize: '0.85rem', minWidth: '120px' }}
                  >
                    <option value="">— pick —</option>
                    {ALL_TEAMS.map(code => (
                      <option key={code} value={code}>{code}</option>
                    ))}
                  </select>
                  {saving === pick_type && (
                    <span style={{ fontSize: '0.7rem', color: 'var(--text-dim)' }}>saving…</span>
                  )}
                </div>
              );
            })}
          </div>
        </div>
      ))}
    </div>
  );
}
