require('dotenv').config({ path: require('path').join(__dirname, '../.env') });
const express = require('express');
const cors = require('cors');
const { seedMatches } = require('./db/seed');

const app = express();
app.use(cors());
app.use(express.json());

// Seed DB on startup
seedMatches();

// Routes
app.use('/api/auth', require('./routes/auth'));
app.use('/api/matches', require('./routes/matches'));
app.use('/api/predictions', require('./routes/predictions'));
app.use('/api/bonus', require('./routes/bonus'));
app.use('/api/leaderboard', require('./routes/leaderboard'));
app.use('/api/admin', require('./routes/admin'));
app.use('/api/config', require('./routes/config'));

const PORT = process.env.PORT || 3003;

// Only listen when run directly (not during tests)
if (require.main === module) {
  const { startPoller } = require('./services/poller');
  startPoller();
  app.listen(PORT, () => console.log(`Backend running on :${PORT}`));
}

app.stopPoller = () => {
  try { require('./services/poller').stopPoller(); } catch {}
};

module.exports = app;
