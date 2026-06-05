const express = require('express');
const { getDb } = require('../db/schema');
const router = express.Router();

router.post('/login', (req, res) => {
  const { access_code } = req.body;
  if (!access_code) return res.status(400).json({ error: 'access_code required' });

  const player = getDb()
    .prepare('SELECT id, name FROM players WHERE access_code = ?')
    .get(access_code);

  if (!player) return res.status(401).json({ error: 'Invalid access code' });
  res.json({ player_id: player.id, name: player.name });
});

module.exports = router;
