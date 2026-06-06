const express = require('express');
const router = express.Router();

router.get('/', (req, res) => {
  const mode = process.env.SCORING_MODE || 'standard';
  const prizes = {
    first:    process.env.PRIZE_1ST  ? Number(process.env.PRIZE_1ST)  : null,
    second:   process.env.PRIZE_2ND  ? Number(process.env.PRIZE_2ND)  : null,
    third:    process.env.PRIZE_3RD  ? Number(process.env.PRIZE_3RD)  : null,
    entryFee: process.env.ENTRY_FEE  ? Number(process.env.ENTRY_FEE)  : null,
  };
  res.json({ scoringMode: mode, prizes });
});

module.exports = router;
