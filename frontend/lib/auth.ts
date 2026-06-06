export interface Player {
  player_id: number;
  name: string;
}

const KEY = 'wc26_player';

export function getPlayer(): Player | null {
  if (typeof window === 'undefined') return null;
  try {
    const raw = localStorage.getItem(KEY);
    return raw ? JSON.parse(raw) : null;
  } catch {
    return null;
  }
}

export function setPlayer(player: Player): void {
  localStorage.setItem(KEY, JSON.stringify(player));
}

export function clearPlayer(): void {
  localStorage.removeItem(KEY);
}

export function getAdminPassword(): string | null {
  if (typeof window === 'undefined') return null;
  return sessionStorage.getItem('wc26_admin');
}

export function setAdminPassword(pw: string): void {
  sessionStorage.setItem('wc26_admin', pw);
}
