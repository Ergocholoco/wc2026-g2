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

describe('Predictions', () => {
  let playerId;

  beforeAll(async () => {
    const loginRes = await request(app).post('/api/auth/login').send({ access_code: 'abc123' });
    playerId = loginRes.body.player_id;
  });

  it('POST /api/predictions saves a prediction', async () => {
    const res = await request(app).post('/api/predictions').send({
      player_id: playerId, match_id: 1, home_score: 2, away_score: 1,
    });
    expect(res.status).toBe(200);
    expect(res.body.ok).toBe(true);
  });

  it('GET /api/predictions?player_id returns saved predictions', async () => {
    const res = await request(app).get(`/api/predictions?player_id=${playerId}`);
    expect(res.status).toBe(200);
    expect(res.body.some(p => p.match_id === 1 && p.home_score === 2)).toBe(true);
  });

  it('POST /api/predictions rejects locked match', async () => {
    // Insert a match that's already past lock time
    const { getDb } = require('../db/schema');
    getDb().prepare(`
      INSERT OR REPLACE INTO matches (id,phase,match_day,home_team,away_team,kickoff_utc,kickoff_mt,status)
      VALUES (999,'group_a',1,'USA','CAN','2020-01-01T00:00:00Z','Jan 1, 2020','SCHEDULED')
    `).run();

    const res = await request(app).post('/api/predictions').send({
      player_id: playerId, match_id: 999, home_score: 1, away_score: 0,
    });
    expect(res.status).toBe(403);
  });
});

describe('Bonus Picks', () => {
  let playerId;
  beforeAll(async () => {
    const r = await request(app).post('/api/auth/login').send({ access_code: 'abc123' });
    playerId = r.body.player_id;
  });

  it('POST /api/bonus saves a bonus pick', async () => {
    const res = await request(app).post('/api/bonus').send({
      player_id: playerId, pick_type: 'champion', team_code: 'BRA',
    });
    expect(res.status).toBe(200);
    expect(res.body.ok).toBe(true);
  });

  it('POST /api/bonus rejects duplicate team in same category', async () => {
    await request(app).post('/api/bonus').send({ player_id: playerId, pick_type: 'quarterfinalist_1', team_code: 'ARG' });
    const res = await request(app).post('/api/bonus').send({ player_id: playerId, pick_type: 'quarterfinalist_2', team_code: 'ARG' });
    expect(res.status).toBe(409);
  });

  it('GET /api/bonus?player_id returns all bonus picks', async () => {
    const res = await request(app).get(`/api/bonus?player_id=${playerId}`);
    expect(res.status).toBe(200);
    expect(res.body.some(p => p.pick_type === 'champion' && p.team_code === 'BRA')).toBe(true);
  });
});

describe('GET /api/leaderboard', () => {
  it('returns sorted player list', async () => {
    const res = await request(app).get('/api/leaderboard');
    expect(res.status).toBe(200);
    expect(Array.isArray(res.body)).toBe(true);
    expect(res.body[0]).toMatchObject({
      player_id: expect.any(Number),
      name: expect.any(String),
      total_points: expect.any(Number),
      position: 1,
    });
  });
});

describe('Admin routes', () => {
  const headers = { 'x-admin-password': 'testpw' };

  beforeAll(() => { process.env.ADMIN_PASSWORD = 'testpw'; });

  it('GET /api/admin/players requires auth', async () => {
    const res = await request(app).get('/api/admin/players');
    expect(res.status).toBe(401);
  });

  it('GET /api/admin/players with auth returns players', async () => {
    const res = await request(app).get('/api/admin/players').set(headers);
    expect(res.status).toBe(200);
    expect(Array.isArray(res.body)).toBe(true);
  });

  it('POST /api/admin/players creates player', async () => {
    const res = await request(app)
      .post('/api/admin/players')
      .set(headers)
      .send({ name: 'Bob', access_code: 'bob99' });
    expect(res.status).toBe(200);
    expect(res.body.name).toBe('Bob');
  });

  it('DELETE /api/admin/players/:id removes player', async () => {
    const create = await request(app)
      .post('/api/admin/players').set(headers)
      .send({ name: 'Temp', access_code: 'tmp1' });
    const id = create.body.id;
    const del = await request(app).delete(`/api/admin/players/${id}`).set(headers);
    expect(del.status).toBe(200);
  });

  it('GET /api/admin/export.csv returns CSV', async () => {
    const res = await request(app).get('/api/admin/export.csv').set(headers);
    expect(res.status).toBe(200);
    expect(res.headers['content-type']).toMatch(/text\/csv/);
    expect(res.text).toContain('Rank,Name');
  });
});
