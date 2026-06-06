const { query, initSchema } = require('./schema');
const { MATCHES } = require('../data/matches');

async function seedMatches() {
  await initSchema();

  const { rows } = await query('SELECT COUNT(*)::int AS c FROM matches');
  if (rows[0].c > 0) return;

  for (const m of MATCHES) {
    await query(
      `INSERT INTO matches (id, phase, match_day, home_team, away_team, kickoff_utc, kickoff_mt, fd_match_id)
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8)
       ON CONFLICT (id) DO NOTHING`,
      [m.id, m.phase, m.match_day, m.home_team, m.away_team, m.kickoff_utc, m.kickoff_mt, m.fd_match_id]
    );
  }
  console.log(`Seeded ${MATCHES.length} matches`);
}

module.exports = { seedMatches };
