const express = require('express');
const { query } = require('../db/schema');
const router = express.Router();

router.post('/login', async (req, res) => {
  const { access_code } = req.body;
  if (!access_code) return res.status(400).json({ error: 'access_code required' });

  const { rows } = await query(
    'SELECT id, name FROM players WHERE LOWER(access_code) = LOWER($1)',
    [access_code]
  );
  const player = rows[0];

  if (!player) return res.status(401).json({ error: 'Invalid access code' });
  res.json({ player_id: player.id, name: player.name });
});

module.exports = router;
