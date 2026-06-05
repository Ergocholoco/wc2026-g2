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

const PORT = process.env.PORT || 3001;

// Only listen when run directly (not during tests)
if (require.main === module) {
  app.listen(PORT, () => console.log(`Backend running on :${PORT}`));
}

module.exports = app;
