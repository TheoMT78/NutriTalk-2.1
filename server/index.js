import express from 'express';
import cors from 'cors';
import { Low } from 'lowdb';
import { JSONFile } from 'lowdb/node';
import { fileURLToPath } from 'url';
import path from 'path';
import { v4 as uuid } from 'uuid';
import bcrypt from 'bcryptjs';
import https from 'https';
import fs from 'fs';
import jwt from 'jsonwebtoken';

const JWT_SECRET = process.env.JWT_SECRET || 'nutritalk-secret';

const app = express();
app.use(cors());
app.use(express.json());

app.use('/api', (req, res, next) => {
  if (req.path === '/login' || req.path === '/register') return next();
  const auth = req.headers.authorization || '';
  const token = auth.startsWith('Bearer ') ? auth.slice(7) : null;
  if (!token) return res.status(401).json({ error: 'Missing token' });
  try {
    const decoded = jwt.verify(token, JWT_SECRET);
    req.userId = decoded.userId;
    next();
  } catch {
    res.status(401).json({ error: 'Invalid token' });
  }
});

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const dbFile = path.join(__dirname, 'db.json');
const db = new Low(new JSONFile(dbFile), { users: [], logs: [], weights: [] });
await db.read();
if (!db.data) db.data = { users: [], logs: [], weights: [] };

app.post('/api/register', async (req, res) => {
  const user = req.body;
  await db.read();
  if (db.data.users.find(u => u.email === user.email)) {
    return res.status(400).json({ error: 'Email already registered' });
  }
  const hashed = await bcrypt.hash(user.password, 10);
  const newUser = { ...user, password: hashed, id: uuid() };
  db.data.users.push(newUser);
  await db.write();
  const token = jwt.sign({ userId: newUser.id }, JWT_SECRET, { expiresIn: '7d' });
  const { password, ...safe } = newUser;
  res.json({ user: safe, token });
});

app.post('/api/login', async (req, res) => {
  const { email, password } = req.body;
  await db.read();
  const user = db.data.users.find(u => u.email === email);
  if (!user) return res.status(401).json({ error: 'Invalid credentials' });

  let passwordValid = false;
  if (user.password.startsWith('$2')) {
    passwordValid = await bcrypt.compare(password, user.password);
  } else {
    // Support legacy accounts with plain text passwords
    if (password === user.password) {
      const hashed = await bcrypt.hash(password, 10);
      user.password = hashed;
      await db.write();
      passwordValid = true;
    }
  }

  if (!passwordValid) return res.status(401).json({ error: 'Invalid credentials' });
  const token = jwt.sign({ userId: user.id }, JWT_SECRET, { expiresIn: '7d' });
  const { password: pw, ...safe } = user;
  res.json({ user: safe, token });
});

app.get('/api/profile/:id', async (req, res) => {
  if (req.userId !== req.params.id) return res.status(403).json({ error: 'Forbidden' });
  await db.read();
  const user = db.data.users.find(u => u.id === req.params.id);
  if (!user) return res.status(404).json({ error: 'User not found' });
  const { password, ...safe } = user;
  res.json(safe);
});

app.put('/api/profile/:id', async (req, res) => {
  if (req.userId !== req.params.id) return res.status(403).json({ error: 'Forbidden' });
  await db.read();
  const idx = db.data.users.findIndex(u => u.id === req.params.id);
  if (idx === -1) return res.status(404).json({ error: 'User not found' });
  db.data.users[idx] = { ...db.data.users[idx], ...req.body };
  await db.write();
  const { password, ...safe } = db.data.users[idx];
  res.json(safe);
});

app.get('/api/logs/:userId/:date', async (req, res) => {
  if (req.userId !== req.params.userId) return res.status(403).json({ error: 'Forbidden' });
  await db.read();
  const { userId, date } = req.params;
  const log = db.data.logs.find(l => l.userId === userId && l.date === date);
  res.json(log ? log.data : null);
});

app.post('/api/logs/:userId/:date', async (req, res) => {
  if (req.userId !== req.params.userId) return res.status(403).json({ error: 'Forbidden' });
  await db.read();
  const { userId, date } = req.params;
  const idx = db.data.logs.findIndex(l => l.userId === userId && l.date === date);
  const entry = { userId, date, data: req.body };
  if (idx === -1) db.data.logs.push(entry); else db.data.logs[idx] = entry;
  await db.write();
  res.json({ success: true });
});

app.get('/api/weights/:userId', async (req, res) => {
  if (req.userId !== req.params.userId) return res.status(403).json({ error: 'Forbidden' });
  await db.read();
  const weights = db.data.weights.find(w => w.userId === req.params.userId);
  res.json(weights ? weights.data : []);
});

app.post('/api/weights/:userId', async (req, res) => {
  if (req.userId !== req.params.userId) return res.status(403).json({ error: 'Forbidden' });
  await db.read();
  const { userId } = req.params;
  const idx = db.data.weights.findIndex(w => w.userId === userId);
  const entry = { userId, data: req.body };
  if (idx === -1) db.data.weights.push(entry); else db.data.weights[idx] = entry;
  await db.write();
  res.json({ success: true });
});

app.get('/api/sync/:userId', async (req, res) => {
  if (req.userId !== req.params.userId) return res.status(403).json({ error: 'Forbidden' });
  await db.read();
  const user = db.data.users.find(u => u.id === req.params.userId);
  const logs = db.data.logs.filter(l => l.userId === req.params.userId);
  const weights = db.data.weights.find(w => w.userId === req.params.userId);
  res.json({ profile: user, logs, weights: weights ? weights.data : [] });
});

const PORT = process.env.PORT || 3001;
if (process.env.SSL_KEY && process.env.SSL_CERT) {
  const options = {
    key: fs.readFileSync(process.env.SSL_KEY),
    cert: fs.readFileSync(process.env.SSL_CERT)
  };
  https.createServer(options, app).listen(PORT, () => {
    console.log(`HTTPS server listening on ${PORT}`);
  });
} else {
  app.listen(PORT, () => {
    console.log(`Server listening on ${PORT}`);
  });
}
