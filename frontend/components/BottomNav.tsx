'use client';
import Link from 'next/link';
import { usePathname } from 'next/navigation';

const TABS = [
  { href: '/',           label: 'Standings',  icon: '🏆' },
  { href: '/picks',      label: 'My Picks',   icon: '⚽' },
  { href: '/schedule',   label: 'Schedule',   icon: '📅' },
  { href: '/como-jugar', label: 'Cómo Jugar', icon: 'ℹ️' },
  { href: '/admin',      label: 'Admin',      icon: '⚙️' },
];

export default function BottomNav() {
  const path = usePathname();
  return (
    <nav style={{
      position: 'fixed', bottom: 0, left: 0, right: 0,
      height: 'var(--tab-h)',
      background: '#0a1628',
      borderTop: '1px solid #1e3460',
      display: 'flex',
      zIndex: 100,
    }}>
      {TABS.map(t => {
        const active = t.href === '/' ? path === '/' : path.startsWith(t.href);
        return (
          <Link key={t.href} href={t.href} style={{
            flex: 1, display: 'flex', flexDirection: 'column',
            alignItems: 'center', justifyContent: 'center', gap: '2px',
            color: active ? 'var(--gold)' : 'var(--text-dim)',
            fontSize: '0.65rem', fontWeight: 600,
            textTransform: 'uppercase', letterSpacing: '0.05em',
            transition: 'color 0.15s',
            borderTop: active ? '2px solid var(--gold)' : '2px solid transparent',
          }}>
            <span style={{ fontSize: '1.25rem', lineHeight: 1 }}>{t.icon}</span>
            {t.label}
          </Link>
        );
      })}
    </nav>
  );
}
