'use client';

const PHASES = [
  { id: 'group_a', label: 'Group A' }, { id: 'group_b', label: 'Group B' },
  { id: 'group_c', label: 'Group C' }, { id: 'group_d', label: 'Group D' },
  { id: 'group_e', label: 'Group E' }, { id: 'group_f', label: 'Group F' },
  { id: 'group_g', label: 'Group G' }, { id: 'group_h', label: 'Group H' },
  { id: 'group_i', label: 'Group I' }, { id: 'group_j', label: 'Group J' },
  { id: 'group_k', label: 'Group K' }, { id: 'group_l', label: 'Group L' },
  { id: 'r32',     label: 'Round 32' }, { id: 'r16',   label: 'Round 16' },
  { id: 'qf',       label: 'Quarter-F' }, { id: 'sf',    label: 'Semi-F' },
  { id: '3rd_place', label: '3rd Place' }, { id: 'final', label: 'Final' },
  { id: 'bonus',    label: '★ Bonus' },
];

interface Props { active: string; onChange: (phase: string) => void; }

export default function PhaseTabs({ active, onChange }: Props) {
  return (
    <div className="phase-tabs-wrapper">
    <div style={{
      display: 'flex', gap: '4px', overflowX: 'auto',
      paddingBottom: '6px', marginBottom: '1rem',
      scrollbarWidth: 'thin',
    }}>
      {PHASES.map(p => (
        <button
          key={p.id}
          onClick={() => onChange(p.id)}
          style={{
            flexShrink: 0,
            padding: '6px 12px',
            borderRadius: '20px',
            border: active === p.id ? '1.5px solid var(--gold)' : '1.5px solid var(--surface2)',
            background: active === p.id ? 'rgba(240,165,0,0.12)' : 'var(--surface)',
            color: active === p.id ? 'var(--gold)' : 'var(--text-dim)',
            fontFamily: 'Barlow Condensed, sans-serif',
            fontWeight: 700, fontSize: '0.85rem',
            letterSpacing: '0.04em',
            transition: 'all 0.15s',
          }}
        >
          {p.label}
        </button>
      ))}
    </div>
    </div>
  );
}
