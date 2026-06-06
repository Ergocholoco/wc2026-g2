'use client';
import { useEffect } from 'react';
import { loadTeams } from '@/lib/teams';

export default function TeamsLoader() {
  useEffect(() => { loadTeams(); }, []);
  return null;
}
