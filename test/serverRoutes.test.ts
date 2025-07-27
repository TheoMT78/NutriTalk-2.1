import request from 'supertest';
import { fileURLToPath } from 'url';
import path from 'path';
import fs from 'fs';
import assert from 'node:assert/strict';
import { test } from 'node:test';

process.env.NODE_ENV = 'test';
const __dirname = path.dirname(fileURLToPath(import.meta.url));
const dbPath = path.join(__dirname, 'test-db.json');
process.env.DB_FILE = dbPath;
process.env.GOOGLE_API_KEY = 'key';
process.env.GOOGLE_CSE_ID = 'cx';

const { default: app } = await import('../server/index.js');

function resetDb() {
  fs.writeFileSync(dbPath, JSON.stringify({ users: [], logs: [], weights: [] }));
}

resetDb();

test('register and login user', async () => {
  const register = await request(app)
    .post('/api/register')
    .send({ email: 'user@example.com', password: 'secret', name: 'Test' });
  assert.equal(register.statusCode, 200);
  const login = await request(app)
    .post('/api/login')
    .send({ email: 'user@example.com', password: 'secret' });
  assert.equal(login.statusCode, 200);
  assert.ok(login.body.token);
});

test('save personal info', async () => {
  const register = await request(app)
    .post('/api/register')
    .send({ email: 'info@example.com', password: 'secret', name: 'Info' });
  const token = register.body.token;
  const userId = register.body.user.id;

  const res = await request(app)
    .post('/api/user/personal-info')
    .set('Authorization', `Bearer ${token}`)
    .send({
      userId,
      name: 'Info',
      birthDate: '2000-01-01',
      sex: 'homme',
      height: 180,
      weight: 80,
      activityLevel: '1-2',
      goal: 'maintien',
    });
  assert.equal(res.statusCode, 200);
  assert.equal(res.body.name, 'Info');
  assert.ok(res.body.dailyCalories);
});

test('update user info via /api/users/:id', async () => {
  const register = await request(app)
    .post('/api/register')
    .send({ email: 'update@example.com', password: 'secret', name: 'Up' });
  const token = register.body.token;
  const userId = register.body.user.id;

  const res = await request(app)
    .patch(`/api/users/${userId}`)
    .set('Authorization', `Bearer ${token}`)
    .send({
      dateOfBirth: '1990-05-05',
      gender: 'femme',
      height: 165,
      weight: 60,
      activityLevel: 'modérée',
      goal: 'maintien',
    });
  assert.equal(res.statusCode, 200);
  assert.equal(res.body.gender, 'femme');
  assert.equal(res.body.height, 165);
});

test('create and fetch logs', async () => {
  const register = await request(app)
    .post('/api/register')
    .send({ email: 'log@example.com', password: 'secret', name: 'Log' });
  const token = register.body.token;
  const userId = register.body.user.id;

  const log = { entries: [], totalCalories: 0, totalProtein: 0, totalCarbs: 0, totalFat: 0, water: 0, steps: 0, targetCalories: 0 };
  await request(app)
    .post(`/api/logs/${userId}/2024-01-01`)
    .set('Authorization', `Bearer ${token}`)
    .send(log)
    .expect(200);

  const res = await request(app)
    .get(`/api/logs/${userId}/2024-01-01`)
    .set('Authorization', `Bearer ${token}`)
    .expect(200);
  assert.deepEqual(res.body, log);
});

test('search nutrition returns results', async () => {
  let called = false;
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  global.fetch = async (_url: string) => {
    called = true;
    return {
      ok: true,
      async json() {
        return {
          items: [
            { title: 'A', link: 'http://a', snippet: 'a' },
            { title: 'B', link: 'http://b', snippet: 'b' },
            { title: 'C', link: 'http://c', snippet: 'c' },
            { title: 'D', link: 'http://d', snippet: 'd' }
          ]
        };
      }
    } as unknown as Response;
  };
  const res = await request(app)
    .get('/search-nutrition?q=test')
    .expect(200);
  assert.equal(called, true);
  assert.deepEqual(res.body, [
    { title: 'A', link: 'http://a', snippet: 'a' },
    { title: 'B', link: 'http://b', snippet: 'b' },
    { title: 'C', link: 'http://c', snippet: 'c' }
  ]);
});

test('scrape nutrition returns data', async () => {
  const realFetch = global.fetch;
  global.fetch = async (url: string) => {
    if (url === 'http://food.com') {
      return {
        ok: true,
        async text() {
          return '<html><body>100 kcal 10 g protein 20g carbohydrates 5 g fat</body></html>';
        }
      } as unknown as Response;
    }
    return { ok: false, text: async () => '' } as unknown as Response;
  };
  const res = await request(app)
    .get('/scrape-nutrition?url=' + encodeURIComponent('http://food.com') + '&name=test')
    .expect(200);
  assert.deepEqual(res.body, { name: 'test', calories: 100, protein: 10, carbs: 20, fat: 5 });
  global.fetch = realFetch;
});


test('deviceSync stores steps', async () => {
  const register = await request(app)
    .post('/api/register')
    .send({ email: 'steps@example.com', password: 'secret', name: 'Steps' });
  const token = register.body.token;
  const userId = register.body.user.id;

  let res = await request(app)
    .post(`/api/device-sync/${userId}`)
    .set('Authorization', `Bearer ${token}`)
    .send({ date: '2025-01-01', steps: 1200 });
  assert.equal(res.statusCode, 200);
  assert.equal(res.body.steps, 1200);

  // reset lastSyncAt to allow a new sync
  let raw = JSON.parse(fs.readFileSync(dbPath, 'utf-8'));
  const idx = raw.logs.findIndex(
    (l: Record<string, unknown>) => l.userId === userId && l.date === '2025-01-01'
  );
  raw.logs[idx].data.lastSyncAt = 0;
  fs.writeFileSync(dbPath, JSON.stringify(raw));

  res = await request(app)
    .post(`/api/device-sync/${userId}`)
    .set('Authorization', `Bearer ${token}`)
    .send({ date: '2025-01-01', steps: 800 });
  assert.equal(res.statusCode, 200);
  assert.equal(res.body.steps, 1200);

  raw = JSON.parse(fs.readFileSync(dbPath, 'utf-8'));
  raw.logs[idx].data.lastSyncAt = 0;
  fs.writeFileSync(dbPath, JSON.stringify(raw));

  res = await request(app)
    .post(`/api/device-sync/${userId}`)
    .set('Authorization', `Bearer ${token}`)
    .send({ date: '2025-01-01', steps: 7000 });
  assert.equal(res.statusCode, 200);
  assert.equal(res.body.steps, 7000);
});
test.after(() => {
  fs.unlinkSync(dbPath);
});
