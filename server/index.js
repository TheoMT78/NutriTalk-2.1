import express from 'express';
import cors from 'cors';
import { fileURLToPath } from 'url';
import path from 'path';
import https from 'https';
import fs from 'fs';
import rateLimit from 'express-rate-limit';
import { body, validationResult } from 'express-validator';
import { registerUser, loginUser, verifyToken } from './authService.js';
import { createDb } from './db.js';
import createDeviceSyncRouter from './deviceSync.js';
import { computeDailyTargets } from './nutrition.js';

const app = express();
app.use(cors());
app.use(express.json());

// Pour Render/proxy : IMPORTANT !
app.set('trust proxy', 1);

const limiter = rateLimit({ windowMs: 60 * 1000, max: 100 });
app.use(limiter);

// Middleware d'authentification
const authMiddleware = (req, res, next) => {
  const auth = req.headers.authorization || '';
  const token = auth.startsWith('Bearer ') ? auth.slice(7) : null;
  if (!token) return res.status(401).json({ error: 'Missing token' });
  const decoded = verifyToken(token);
  if (!decoded) return res.status(401).json({ error: 'Invalid token' });
  req.userId = decoded.userId;
  next();
};

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const db = await createDb();

// Route de synchronisation des appareils
const deviceSyncRouter = createDeviceSyncRouter(db);
app.use('/api/device-sync', deviceSyncRouter);

// --- ROUTES PUBLIQUES --- //

app.post('/api/register',
  body('email').isEmail(),
  body('password').isLength({ min: 6 }),
  body('name').notEmpty(),
  async (req, res) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }
    try {
      const result = await registerUser(db, req.body);
      res.json(result);
    } catch (err) {
      const msg = err instanceof Error ? err.message : 'Registration failed';
      res.status(400).json({ error: msg });
    }
  });

app.post('/api/login',
  body('email').isEmail(),
  body('password').notEmpty(),
  async (req, res) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }
    try {
      const remember = !!req.body.rememberMe;
      const result = await loginUser(db, req.body.email, req.body.password, remember);
      const cookieOpts = { httpOnly: false, sameSite: 'lax' };
      if (remember) cookieOpts.maxAge = 30 * 24 * 60 * 60 * 1000;
      res.cookie('token', result.token, cookieOpts);
      res.json(result);
    } catch (err) {
      const msg = err instanceof Error ? err.message : 'Invalid credentials';
      res.status(401).json({ error: msg });
    }
  });

// Recherche nutritionnelle via Google Programmable Search
app.get('/search-nutrition', async (req, res) => {
  const query = req.query.q;
  if (!query) return res.status(400).json({ error: 'Missing query' });
  const key = process.env.GOOGLE_API_KEY;
  const cx = process.env.GOOGLE_CSE_ID;
  if (!key || !cx) {
    return res.status(500).json({ error: 'Échec recherche Google' });
  }
  const url =
    'https://www.googleapis.com/customsearch/v1?q=' +
    encodeURIComponent(query) +
    `&key=${key}&cx=${cx}`;
  try {
    const resp = await fetch(url);
    if (!resp.ok) {
      console.error('google search error', await resp.text());
      return res.status(500).json({ error: 'Échec recherche Google' });
    }
    const data = await resp.json();
    const results = (data.items || [])
      .slice(0, 3)
      .map(({ title, link, snippet }) => ({ title, link, snippet }));
    res.json(results);
  } catch (err) {
    console.error('search-nutrition error', err);
    res.status(500).json({ error: 'Échec recherche Google' });
  }
});

// --- ROUTES PROTÉGÉES --- //

const protectedRouter = express.Router();
protectedRouter.use(authMiddleware);

protectedRouter.get('/profile/:id', async (req, res) => {
  if (req.userId !== req.params.id) return res.status(403).json({ error: 'Forbidden' });
  const user = await db.getUserById(req.params.id);
  if (!user) return res.status(404).json({ error: 'User not found' });
  const { password, ...safe } = user;
  res.json(safe);
});

// 🔥 PATCH DE SÉCURITÉ ICI : ignore tout update du password venant du front
protectedRouter.put('/profile/:id', async (req, res) => {
  if (req.userId !== req.params.id) return res.status(403).json({ error: 'Forbidden' });
  const user = await db.getUserById(req.params.id);
  if (!user) return res.status(404).json({ error: 'User not found' });
  // Ignore le champ password si présent dans le front !
  const { password, ...safeBody } = req.body;
  await db.updateUser(req.params.id, safeBody);
  const updated = await db.getUserById(req.params.id);
  const { password: _pw, ...safe } = updated;
  res.json(safe);
});

// Mise à jour du profil utilisateur via /api/users/:id
protectedRouter.patch('/users/:id', async (req, res) => {
  if (req.userId !== req.params.id) return res.status(403).json({ error: 'Forbidden' });
  try {
    const { password, ...safeBody } = req.body;
    await db.updateUser(req.params.id, safeBody);
    const updated = await db.getUserById(req.params.id);
    if (!updated) return res.status(404).json({ error: 'User not found' });
    const { password: _pw, ...safe } = updated;
    res.json(safe);
  } catch (err) {
    console.error('update user error', err);
    res.status(500).json({ error: 'Failed to update user' });
  }
});

protectedRouter.post('/user/personal-info', async (req, res) => {
  const {
    userId,
    name,
    birthDate,
    sex,
    height,
    weight,
    activityLevel,
    goal,
  } = req.body || {};
  if (req.userId !== userId) return res.status(403).json({ error: 'Forbidden' });
  try {
    const targets = computeDailyTargets({
      weight,
      height,
      birthDate,
      gender: sex,
      activityLevel,
      goal,
    });
    await db.updateUser(userId, {
      name,
      dateOfBirth: birthDate,
      gender: sex,
      height,
      weight,
      activityLevel,
      goal,
      dailyCalories: targets.calories,
      dailyProtein: targets.protein,
      dailyCarbs: targets.carbs,
      dailyFat: targets.fat,
    });
    const updated = await db.getUserById(userId);
    const { password: _pw2, ...safe } = updated;
    res.json(safe);
  } catch (err) {
    console.error('personal-info error', err);
    res.status(500).json({ error: 'Failed to save info' });
  }
});

protectedRouter.get('/logs/:userId/:date', async (req, res) => {
  if (req.userId !== req.params.userId) return res.status(403).json({ error: 'Forbidden' });
  const { userId, date } = req.params;
  const log = await db.getLogs(userId, date);
  res.json(log);
});

protectedRouter.post('/logs/:userId/:date',
  body().isObject(),
  async (req, res) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }
    if (req.userId !== req.params.userId) return res.status(403).json({ error: 'Forbidden' });
    const { userId, date } = req.params;
    await db.upsertLog(userId, date, req.body);
    res.json({ success: true });
  });

protectedRouter.get('/weights/:userId', async (req, res) => {
  if (req.userId !== req.params.userId) return res.status(403).json({ error: 'Forbidden' });
  const weights = await db.getWeights(req.params.userId);
  res.json(weights);
});

protectedRouter.post('/weights/:userId',
  body().isArray(),
  async (req, res) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }
    if (req.userId !== req.params.userId) return res.status(403).json({ error: 'Forbidden' });
    const { userId } = req.params;
    await db.upsertWeights(userId, req.body);
    res.json({ success: true });
  });

protectedRouter.get('/sync/:userId', async (req, res) => {
  if (req.userId !== req.params.userId) return res.status(403).json({ error: 'Forbidden' });
  const user = await db.getUserById(req.params.userId);
  const logs = await db.getLogs(req.params.userId);
  const weights = await db.getWeights(req.params.userId);
  res.json({ profile: user, logs, weights });
});

// Utilise le router protégé après les routes publiques
app.use('/api', protectedRouter);

// --- SERVER --- //
const PORT = process.env.PORT || 3001;
if (process.env.NODE_ENV !== 'test') {
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
}

export default app;
