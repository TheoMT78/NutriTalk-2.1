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
test.after(() => {
  fs.unlinkSync(dbPath);
});
