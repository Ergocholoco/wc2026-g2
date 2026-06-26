'use client';
import { useEffect, useState } from 'react';
import { getBonusPicks, saveBonusPick, BonusPick, getConfig, AppConfig } from '@/lib/api';
import { teamFlag, teamName } from '@/lib/teams';

const WC2026_TEAMS = [
  'ARG','AUS','AUT','BEL','BIH','BRA','CAN','CIV','COD','COL',
  'CPV','CRO','CUW','CZE','ECU','EGY','ENG','ESP','FRA','GER',
  'GHA','HAI','IRN','IRQ','JOR','JPN','KOR','KSA','MAR','MEX',
  'NED','NOR','NZL','PAN','PAR','POR','QAT','RSA','SCO','SEN',
  'SUI','SWE','TUN','TUR','URY','USA','UZB','ALG',
];

const GROUP_TEAMS: Record<string, string[]> = {
  a: ['MEX','RSA','KOR','CZE'],
  b: ['CAN','BIH','QAT','SUI'],
  c: ['BRA','MAR','HAI','SCO'],
  d: ['USA','PAR','AUS','TUR'],
  e: ['GER','CUW','CIV','ECU'],
  f: ['NED','JPN','SWE','TUN'],
  g: ['BEL','EGY','IRN','NZL'],
  h: ['ESP','CPV','KSA','URY'],
  i: ['FRA','SEN','IRQ','NOR'],
  j: ['ARG','ALG','AUT','JOR'],
  k: ['POR','COD','UZB','COL'],
  l: ['ENG','CRO','GHA','PAN'],
};

function teamsForPickType(pickType: string): string[] {
  const m = pickType.match(/^group_([a-l])_/);
  return m ? (GROUP_TEAMS[m[1]] ?? WC2026_TEAMS) : WC2026_TEAMS;
}

const GROUPS = ['a','b','c','d','e','f','g','h','i','j','k','l'];

interface BonusSection {
  title: string;
  picks: { pick_type: string; label: string }[];
}

function standardSections(): BonusSection[] {
  return [
    {
      title: '🏆 Knockout Picks',
      picks: [
        { pick_type: 'champion',    label: 'Champion' },
        { pick_type: 'third_place', label: '3rd Place' },
        { pick_type: 'finalist_1',  label: 'Finalist 1' },
        { pick_type: 'finalist_2',  label: 'Finalist 2' },
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
}

function advancedSections(): BonusSection[] {
  return [
    {
      title: '🏆 Tournament Picks',
      picks: [
        { pick_type: 'champion',     label: 'World Cup Winner' },
        { pick_type: 'runner_up',    label: 'Runner-up (2nd place)' },
        { pick_type: 'third_place',  label: '3rd Place' },
        { pick_type: 'fourth_place', label: '4th Place' },
      ],
    },
    {
      title: '🎯 Round of 16 Teams',
      picks: Array.from({ length: 16 }, (_, i) => ({
        pick_type: `r16_team_${i + 1}`,
        label: `R16 Team ${i + 1}`,
      })),
    },
  ];
}

interface Props { player: { player_id: number; name: string }; }

export default function BonusPicksForm({ player }: Props) {
  const [picks, setPicks] = useState<BonusPick[]>([]);
  const [config, setConfig] = useState<AppConfig | null>(null);
  const [saving, setSaving] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    getBonusPicks(player.player_id).then(setPicks).catch(console.error);
    getConfig().then(setConfig).catch(console.error);
  }, [player.player_id]);

  const pickMap = new Map(picks.map(p => [p.pick_type, p]));
  const sections = config?.scoringMode === 'advanced' ? advancedSections() : standardSections();

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

      {sections.map(section => (
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
                  {existing?.team_code && (
                    <span style={{ fontSize: '1.2rem' }}>{teamFlag(existing.team_code)}</span>
                  )}
                  <select
                    disabled={!!isLocked}
                    value={existing?.team_code ?? ''}
                    onChange={e => handleChange(pick_type, e.target.value)}
                    style={{ padding: '4px 8px', fontSize: '0.85rem', minWidth: '140px' }}
                  >
                    <option value="">— pick —</option>
                    {teamsForPickType(pick_type).map(code => (
                      <option key={code} value={code}>{teamName(code)} ({code})</option>
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
