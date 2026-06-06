const express = require('express');
const { getDb } = require('../db/schema');
const router = express.Router();

function isLocked(kickoff_utc) {
  return Date.now() >= new Date(kickoff_utc).getTime() - 60 * 60 * 1000;
}

router.get('/', (req, res) => {
  const { phase } = req.query;
  let rows;
  if (phase) {
    rows = getDb().prepare('SELECT * FROM matches WHERE phase = ? ORDER BY kickoff_utc').all(phase);
  } else {
    rows = getDb().prepare('SELECT * FROM matches ORDER BY kickoff_utc').all();
  }
  res.json(rows.map(m => ({ ...m, locked: isLocked(m.kickoff_utc) })));
});

const { TEAMS } = require('../data/teams');

router.get('/teams', (req, res) => {
  res.json(TEAMS);
});

module.exports = router;
