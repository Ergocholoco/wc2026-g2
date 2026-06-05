const request = require('supertest');
const Database = require('better-sqlite3');
const { _setDb, _initSchema } = require('../db/schema');

let app;

beforeAll(() => {
  // Use in-memory DB for tests
  const db = new Database(':memory:');
  db.pragma('foreign_keys = ON');
  _initSchema(db);
  _setDb(db);

  // Seed one player
  db.prepare("INSERT INTO players (name, access_code) VALUES ('Test User', 'abc123')").run();

  // Seed matches into in-memory DB
  const { seedMatches } = require('../db/seed');
  seedMatches();

  app = require('../index');
});

afterAll(() => {
  // index.js may start the poller — stop it if exported
  if (app.stopPoller) app.stopPoller();
});

describe('POST /api/auth/login', () => {
  it('returns player_id and name for valid code', async () => {
    const res = await request(app)
      .post('/api/auth/login')
      .send({ access_code: 'abc123' });
    expect(res.status).toBe(200);
    expect(res.body).toMatchObject({ name: 'Test User' });
    expect(res.body.player_id).toBeGreaterThan(0);
  });

  it('returns 401 for invalid code', async () => {
    const res = await request(app)
      .post('/api/auth/login')
      .send({ access_code: 'wrong' });
    expect(res.status).toBe(401);
  });

  it('returns 400 when access_code is missing', async () => {
    const res = await request(app)
      .post('/api/auth/login')
      .send({});
    expect(res.status).toBe(400);
  });
});

describe('GET /api/matches', () => {
  it('returns array of matches with locked field', async () => {
    const res = await request(app).get('/api/matches');
    expect(res.status).toBe(200);
    expect(Array.isArray(res.body)).toBe(true);
    expect(res.body.length).toBe(104);
    expect(res.body[0]).toMatchObject({
      id: expect.any(Number),
      phase: expect.any(String),
      home_team: expect.any(String),
      away_team: expect.any(String),
      kickoff_mt: expect.any(String),
      locked: expect.any(Boolean),
    });
  });

  it('filters by phase', async () => {
    const res = await request(app).get('/api/matches?phase=group_a');
    expect(res.status).toBe(200);
    expect(res.body.every(m => m.phase === 'group_a')).toBe(true);
    expect(res.body.length).toBe(6);
  });
});
