#!/usr/bin/env node
// node scripts/fetch-teams.js
require('dotenv').config({ path: require('path').join(__dirname, '../../.env') });
const fs = require('fs');
const path = require('path');

const API_KEY = process.env.FOOTBALL_API_KEY;
if (!API_KEY) { console.error('FOOTBALL_API_KEY missing'); process.exit(1); }

const FLAG_OVERRIDES = {
  ENG: '🏴󠁧󠁢󠁥󠁮󠁧󠁿', SCO: '🏴󠁧󠁢󠁳󠁣󠁴󠁿', WAL: '🏴󠁧󠁢󠁷󠁬󠁳󠁿',
};

function flagEmoji(iso2) {
  if (!iso2 || iso2.length !== 2) return '🏳';
  return [...iso2.toUpperCase()]
    .map(c => String.fromCodePoint(0x1F1E0 + c.charCodeAt(0) - 65))
    .join('');
}

async function main() {
  const res = await fetch('https://api.football-data.org/v4/competitions/WC/teams', {
    headers: { 'X-Auth-Token': API_KEY },
  });
  if (!res.ok) { console.error(res.status, await res.text()); process.exit(1); }
  const { teams } = await res.json();

  const out = {};
  for (const t of teams) {
    const code = t.tla;
    out[code] = {
      name: t.shortName || t.name,
      flag: FLAG_OVERRIDES[code] || flagEmoji(t.area?.code || ''),
    };
  }

  const content = `// Auto-generated ${new Date().toISOString()} — do not edit manually\nconst TEAMS = ${JSON.stringify(out, null, 2)};\nmodule.exports = { TEAMS };\n`;
  const outPath = path.join(__dirname, '../data/teams.js');
  fs.mkdirSync(path.dirname(outPath), { recursive: true });
  fs.writeFileSync(outPath, content);
  console.log(`Written ${Object.keys(out).length} teams to ${outPath}`);
}
main().catch(console.error);
