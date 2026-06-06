let _teams: Record<string, { name: string; flag: string }> = {
  TBD: { name: 'TBD', flag: '🏳' },
};

export async function loadTeams() {
  try {
    const res = await fetch('/api/matches/teams');
    if (res.ok) _teams = await res.json();
  } catch {}
}

export function teamName(code: string): string {
  return _teams[code]?.name ?? code;
}

export function teamFlag(code: string): string {
  return _teams[code]?.flag ?? '🏳';
}
