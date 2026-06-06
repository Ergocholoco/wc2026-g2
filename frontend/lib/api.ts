import { getPlayer, getAdminPassword } from './auth';

async function apiFetch<T>(path: string, init?: RequestInit): Promise<T> {
  const res = await fetch(path, init);
  if (!res.ok) {
    const err = await res.json().catch(() => ({ error: res.statusText }));
    throw new Error(err.error ?? res.statusText);
  }
  return res.json();
}

export function login(access_code: string) {
  return apiFetch<{ player_id: number; name: string }>('/api/auth/login', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ access_code }),
  });
}

export interface Match {
  id: number;
  phase: string;
  match_day: number;
  home_team: string;
  away_team: string;
  kickoff_mt: string;
  kickoff_utc: string;
  home_score: number | null;
  away_score: number | null;
  status: string;
  locked: boolean;
}

export function getMatches(phase?: string): Promise<Match[]> {
  const q = phase ? `?phase=${phase}` : '';
  return apiFetch<Match[]>(`/api/matches${q}`);
}

export interface Prediction {
  match_id: number;
  home_score: number;
  away_score: number;
  locked: boolean;
}

export function getPredictions(player_id: number): Promise<Prediction[]> {
  return apiFetch<Prediction[]>(`/api/predictions?player_id=${player_id}`);
}

export function savePrediction(match_id: number, home_score: number, away_score: number) {
  const player = getPlayer();
  if (!player) throw new Error('Not logged in');
  return apiFetch<{ ok: boolean }>('/api/predictions', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ player_id: player.player_id, match_id, home_score, away_score }),
  });
}

export interface BonusPick {
  pick_type: string;
  team_code: string;
  locked: boolean;
}

export function getBonusPicks(player_id: number): Promise<BonusPick[]> {
  return apiFetch<BonusPick[]>(`/api/bonus?player_id=${player_id}`);
}

export function saveBonusPick(pick_type: string, team_code: string) {
  const player = getPlayer();
  if (!player) throw new Error('Not logged in');
  return apiFetch<{ ok: boolean }>('/api/bonus', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ player_id: player.player_id, pick_type, team_code }),
  });
}

export interface LeaderboardEntry {
  player_id: number;
  name: string;
  total_points: number;
  match_points: number;
  bonus_points: number;
  position: number;
}

export function getLeaderboard(): Promise<LeaderboardEntry[]> {
  return apiFetch<LeaderboardEntry[]>('/api/leaderboard');
}

function adminHeaders() {
  const pw = getAdminPassword();
  return { 'Content-Type': 'application/json', 'X-Admin-Password': pw ?? '' };
}

export function getAdminPlayers() {
  return apiFetch<any[]>('/api/admin/players', { headers: adminHeaders() });
}

export function createAdminPlayer(name: string, access_code: string) {
  return apiFetch<any>('/api/admin/players', {
    method: 'POST',
    headers: adminHeaders(),
    body: JSON.stringify({ name, access_code }),
  });
}

export function deleteAdminPlayer(id: number) {
  return apiFetch<{ ok: boolean }>(`/api/admin/players/${id}`, {
    method: 'DELETE',
    headers: adminHeaders(),
  });
}

export function getAdminPlayerPicks(id: number) {
  return apiFetch<any>(`/api/admin/players/${id}/picks`, { headers: adminHeaders() });
}

export function triggerAdminRefresh() {
  return apiFetch<{ ok: boolean }>('/api/admin/refresh', {
    method: 'POST',
    headers: adminHeaders(),
  });
}

export interface AppConfig {
  scoringMode: 'standard' | 'advanced';
  prizes: { first: number | null; second: number | null; third: number | null; entryFee: number | null };
}

let _config: AppConfig | null = null;
export async function getConfig(): Promise<AppConfig> {
  if (_config) return _config;
  _config = await apiFetch<AppConfig>('/api/config');
  return _config;
}
