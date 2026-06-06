const express = require('express');
const { query } = require('../db/schema');
const router = express.Router();

function isLocked(kickoff_utc) {
  return Date.now() >= new Date(kickoff_utc).getTime() - 60 * 60 * 1000;
}

router.get('/', async (req, res) => {
  const { phase } = req.query;
  let rows;
  if (phase) {
    ({ rows } = await query('SELECT * FROM matches WHERE phase = $1 ORDER BY kickoff_utc', [phase]));
  } else {
    ({ rows } = await query('SELECT * FROM matches ORDER BY kickoff_utc'));
  }
  res.json(rows.map(m => ({ ...m, locked: isLocked(m.kickoff_utc) })));
});

const { TEAMS } = require('../data/teams');

router.get('/teams', (req, res) => {
  res.json(TEAMS);
});

module.exports = router;
