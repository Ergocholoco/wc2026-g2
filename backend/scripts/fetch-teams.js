#!/usr/bin/env node
// node scripts/fetch-teams.js
require('dotenv').config({ path: require('path').join(__dirname, '../../.env') });
const fs = require('fs');
const path = require('path');

const API_KEY = process.env.FOOTBALL_API_KEY;
if (!API_KEY) { console.error('FOOTBALL_API_KEY missing'); process.exit(1); }

// Regional flag overrides (no standard ISO2 emoji)
const FLAG_OVERRIDES = {
  ENG: '🏴󠁧󠁢󠁥󠁮󠁧󠁿', SCO: '🏴󠁧󠁢󠁳󠁣󠁴󠁿', WAL: '🏴󠁧󠁢󠁷󠁬󠁳󠁿',
};

// TLA (3-letter code from football-data) → ISO 3166-1 alpha-2
const TLA_TO_ISO2 = {
  ARG:'AR', AUS:'AU', AUT:'AT', BEL:'BE', BIH:'BA', BRA:'BR',
  CAN:'CA', CIV:'CI', COD:'CD', COL:'CO', CPV:'CV', CRO:'HR',
  CUW:'CW', CZE:'CZ', ECU:'EC', EGY:'EG', ENG:'GB', ESP:'ES',
  FRA:'FR', GER:'DE', GHA:'GH', HAI:'HT', IRN:'IR', IRQ:'IQ',
  JOR:'JO', JPN:'JP', KOR:'KR', KSA:'SA', MAR:'MA', MEX:'MX',
  NED:'NL', NOR:'NO', NZL:'NZ', PAN:'PA', PAR:'PY', POR:'PT',
  QAT:'QA', RSA:'ZA', SCO:'GB', SEN:'SN', SUI:'CH', SWE:'SE',
  TUN:'TN', TUR:'TR', URY:'UY', USA:'US', UZB:'UZ', ALG:'DZ',
};

function flagEmoji(tla) {
  const iso2 = TLA_TO_ISO2[tla];
  if (!iso2) return '🏳';
  return [...iso2.toUpperCase()]
    .map(c => String.fromCodePoint(0x1F1E6 + c.charCodeAt(0) - 65))
    .join('');
}

async function main() {
  const res = await fetch('https://api.football-data.org/v4/competitions/WC/teams', {
    headers: { 'X-Auth-Token': API_KEY },
  });
  if (!res.ok) { console.error(res.status, await res.text()); process.exit(1); }
  const { teams } = await res.json();
  if (!Array.isArray(teams) || teams.length === 0) {
    console.error('Unexpected API response: no teams array');
    process.exit(1);
  }

  const out = {};
  for (const t of teams) {
    const code = t.tla;
    out[code] = {
      name: t.shortName || t.name,
      flag: FLAG_OVERRIDES[code] || flagEmoji(code),
    };
  }

  const content = `// Auto-generated ${new Date().toISOString()} — do not edit manually\nconst TEAMS = ${JSON.stringify(out, null, 2)};\nmodule.exports = { TEAMS };\n`;
  const outPath = path.join(__dirname, '../data/teams.js');
  fs.mkdirSync(path.dirname(outPath), { recursive: true });
  fs.writeFileSync(outPath, content);
  console.log(`Written ${Object.keys(out).length} teams to ${outPath}`);
}
main().catch(console.error);
