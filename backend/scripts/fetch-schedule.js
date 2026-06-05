#!/usr/bin/env node
// node scripts/fetch-schedule.js
require('dotenv').config({ path: require('path').join(__dirname, '../../.env') });
const fs = require('fs');
const path = require('path');

const API_KEY = process.env.FOOTBALL_API_KEY;
if (!API_KEY) { console.error('FOOTBALL_API_KEY missing'); process.exit(1); }

function toMT(utcString) {
  return new Date(utcString).toLocaleString('en-US', {
    timeZone: 'America/Denver',
    month: 'short', day: 'numeric',
    hour: 'numeric', minute: '2-digit', hour12: true,
  }) + ' MT';
}

function toPhase(stage, group) {
  if (stage === 'GROUP_STAGE') {
    const g = (group || 'GROUP_A').replace('GROUP_', '').toLowerCase();
    return `group_${g}`;
  }
  return {
    ROUND_OF_32: 'r32', ROUND_OF_16: 'r16',
    QUARTER_FINALS: 'qf', SEMI_FINALS: 'sf',
    THIRD_PLACE: '3rd_place', FINAL: 'final',
  }[stage] || 'group_a';
}

async function main() {
  const res = await fetch('https://api.football-data.org/v4/competitions/WC/matches', {
    headers: { 'X-Auth-Token': API_KEY },
  });
  if (!res.ok) { console.error(res.status, await res.text()); process.exit(1); }
  const { matches } = await res.json();

  const out = matches.map((m, i) => ({
    id: i + 1,
    phase: toPhase(m.stage, m.group),
    match_day: m.matchday || 1,
    home_team: m.homeTeam.tla || 'TBD',
    away_team: m.awayTeam.tla || 'TBD',
    kickoff_utc: m.utcDate,
    kickoff_mt: toMT(m.utcDate),
    fd_match_id: m.id,
  }));

  const content = `// Auto-generated ${new Date().toISOString()} — do not edit manually\nconst MATCHES = ${JSON.stringify(out, null, 2)};\nmodule.exports = { MATCHES };\n`;
  const outPath = path.join(__dirname, '../data/matches.js');
  fs.mkdirSync(path.dirname(outPath), { recursive: true });
  fs.writeFileSync(outPath, content);
  console.log(`Written ${out.length} matches to ${outPath}`);
}
main().catch(console.error);
