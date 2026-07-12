const { newDb } = require('pg-mem');
const { _setPool, initSchema, query } = require('../db/schema');
const { triggerPoll } = require('../services/poller');

function registerSubstr(memDb) {
  memDb.public.registerFunction({
    name: 'substr',
    args: ['text', 'int', 'int'],
    returns: 'text',
    implementation: (s, a, b) => String(s).substr(a - 1, b),
  });
}

function apiMatch(overrides = {}) {
  return {
    id: 537385,
    status: 'FINISHED',
    utcDate: '2026-07-11T21:00:00Z',
    homeTeam: { tla: 'NOR' },
    awayTeam: { tla: 'ENG' },
    score: {
      winner: 'AWAY_TEAM',
      duration: 'EXTRA_TIME',
      fullTime: { home: 1, away: 2 },
      regularTime: { home: 1, away: 1 },
    },
    ...overrides,
  };
}

let apiMatches;

beforeEach(async () => {
  const memDb = newDb();
  registerSubstr(memDb);
  const { Pool } = memDb.adapters.createPg();
  _setPool(new Pool());
  await initSchema();

  process.env.FOOTBALL_API_KEY = 'test-key';
  process.env.SCORING_MODE = 'standard';
  apiMatches = [];
  global.fetch = jest.fn(async (url) => {
    const u = String(url);
    if (u.includes('/competitions/WC/matches')) {
      return { ok: true, json: async () => ({ matches: apiMatches }) };
    }
    if (/\/matches\/\d+$/.test(u)) {
      const id = Number(u.split('/').pop());
      const m = apiMatches.find((x) => x.id === id);
      return { ok: true, json: async () => m || {} };
    }
    return { ok: true, json: async () => ({}) };
  });
});

afterEach(() => {
  delete process.env.FOOTBALL_API_KEY;
  delete process.env.SCORING_MODE;
});

async function insertMatch({ status, homeScore = null, awayScore = null, winner = null }) {
  await query(`
    INSERT INTO matches (id, phase, match_day, home_team, away_team, kickoff_utc, kickoff_mt,
                         home_score, away_score, status, fd_match_id, winner)
    VALUES (99, 'qf', 1, 'NOR', 'ENG', '2026-07-11T21:00:00Z', 'Jul 11, 3:00 PM MT',
            $1, $2, $3, 537385, $4)
  `, [homeScore, awayScore, status, winner]);
}

describe('poller — extra-time matches use the 90-minute score', () => {
  it('does not store the post-ET fullTime score while regularTime is still missing', async () => {
    // Race window: API marks the match FINISHED with duration EXTRA_TIME and
    // fullTime populated, but regularTime not yet filled in by the provider.
    await insertMatch({ status: 'IN_PLAY' });
    apiMatches = [apiMatch({ score: {
      winner: 'AWAY_TEAM',
      duration: 'EXTRA_TIME',
      fullTime: { home: 1, away: 2 },
      regularTime: { home: null, away: null },
    } })];

    await triggerPoll();

    const m = (await query('SELECT * FROM matches WHERE id = 99')).rows[0];
    expect(m.home_score).toBeNull();
    expect(m.away_score).toBeNull();
  });

  it('stores the 90-min score on a later cycle once regularTime is populated', async () => {
    await insertMatch({ status: 'FINISHED' }); // finished, scores still pending
    apiMatches = [apiMatch()];

    await triggerPoll();

    const m = (await query('SELECT * FROM matches WHERE id = 99')).rows[0];
    expect(m.home_score).toBe(1);
    expect(m.away_score).toBe(1);
    expect(m.winner).toBe('AWAY_TEAM');
  });

  it('corrects an already-stored score that disagrees with the 90-min score and rescores players', async () => {
    // The bug in production: the post-ET 1-2 got stored and locked in.
    await insertMatch({ status: 'FINISHED', homeScore: 1, awayScore: 2, winner: 'AWAY_TEAM' });
    await query(`INSERT INTO players (id, name, access_code) VALUES (1, 'Wuilder', 'abc')`);
    await query(`
      INSERT INTO predictions (player_id, match_id, home_score, away_score, locked)
      VALUES (1, 99, 1, 1, 1)
    `);
    apiMatches = [apiMatch()]; // API now reports regularTime 1-1

    await triggerPoll();

    const m = (await query('SELECT * FROM matches WHERE id = 99')).rows[0];
    expect(m.home_score).toBe(1);
    expect(m.away_score).toBe(1);

    const cache = (await query('SELECT * FROM scores_cache WHERE player_id = 1')).rows[0];
    expect(cache.match_points).toBe(5); // exact 1-1 in standard mode
  });
});
