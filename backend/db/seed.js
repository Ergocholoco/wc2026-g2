const { getDb } = require('./schema');
const { MATCHES } = require('../data/matches');

function seedMatches() {
  const db = getDb();
  const { c } = db.prepare('SELECT COUNT(*) AS c FROM matches').get();
  if (c > 0) return;

  const insert = db.prepare(`
    INSERT INTO matches (id, phase, match_day, home_team, away_team, kickoff_utc, kickoff_mt, fd_match_id)
    VALUES (@id, @phase, @match_day, @home_team, @away_team, @kickoff_utc, @kickoff_mt, @fd_match_id)
  `);
  db.transaction(ms => ms.forEach(m => insert.run(m)))(MATCHES);
  console.log(`Seeded ${MATCHES.length} matches`);
}

module.exports = { seedMatches };
