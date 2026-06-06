import { LeaderboardEntry } from '@/lib/api';

const MEDALS = ['🥇', '🥈', '🥉'];

function initials(name: string) {
  return name.split(' ').map(w => w[0]).join('').toUpperCase().slice(0, 2);
}

const AVATAR_COLORS = [
  '#f0a500','#1a9e6a','#3b82f6','#e05555','#8b5cf6','#ec4899','#f97316','#14b8a6',
];

function avatarColor(name: string) {
  let hash = 0;
  for (const c of name) hash = (hash * 31 + c.charCodeAt(0)) & 0xFFFFFF;
  return AVATAR_COLORS[hash % AVATAR_COLORS.length];
}

interface Props { entry: LeaderboardEntry; isMe: boolean; }

export default function LeaderboardCard({ entry, isMe }: Props) {
  const medal = MEDALS[entry.position - 1];
  return (
    <div style={{
      display: 'flex', alignItems: 'center', gap: '0.75rem',
      background: isMe ? 'rgba(240,165,0,0.07)' : 'var(--surface)',
      border: isMe ? '1px solid rgba(240,165,0,0.3)' : '1px solid var(--surface2)',
      borderRadius: 'var(--radius)',
      padding: '0.75rem 1rem',
    }}>
      <div style={{ width: '28px', textAlign: 'center', flexShrink: 0 }}>
        {medal
          ? <span style={{ fontSize: '1.3rem' }}>{medal}</span>
          : <span style={{ color: 'var(--text-dim)', fontWeight: 700, fontFamily: 'Barlow Condensed, sans-serif' }}>{entry.position}</span>
        }
      </div>

      <div style={{
        width: '36px', height: '36px', borderRadius: '50%',
        background: avatarColor(entry.name), flexShrink: 0,
        display: 'flex', alignItems: 'center', justifyContent: 'center',
        fontFamily: 'Barlow Condensed, sans-serif', fontWeight: 800,
        fontSize: '0.85rem', color: '#0d1b35',
      }}>
        {initials(entry.name)}
      </div>

      <div style={{ flex: 1, minWidth: 0 }}>
        <div style={{ fontWeight: 600, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
          {entry.name}
        </div>
        <div style={{ fontSize: '0.75rem', color: 'var(--text-dim)', marginTop: '1px' }}>
          {entry.match_points} match · {entry.bonus_points} bonus
        </div>
      </div>

      <div style={{
        background: 'var(--gold)', color: '#0d1b35',
        fontFamily: 'Barlow Condensed, sans-serif', fontWeight: 800,
        fontSize: '1.1rem', padding: '4px 10px', borderRadius: '20px',
        flexShrink: 0,
      }}>
        {entry.total_points} <span style={{ fontSize: '0.75rem', fontWeight: 600 }}>pts</span>
      </div>
    </div>
  );
}
