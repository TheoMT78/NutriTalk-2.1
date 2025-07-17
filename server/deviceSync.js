import express from 'express';
import { verifyToken } from './authService.js';

export default function createDeviceSyncRouter(db) {
  const router = express.Router();

  router.post('/:userId', async (req, res) => {
    const auth = req.headers.authorization || '';
    const token = auth.startsWith('Bearer ') ? auth.slice(7) : null;
    const decoded = token ? verifyToken(token) : null;
    if (!decoded || decoded.userId !== req.params.userId) {
      return res.status(401).json({ error: 'Unauthorized' });
    }
    const { date } = req.body || {};
    if (!date) return res.status(400).json({ error: 'Missing date' });

    // Simuler la récupération depuis Google Fit / Apple Health
    const steps = Math.round(Math.random() * 3000) + 3000;

    const current = (await db.getLogs(req.params.userId, date)) || {
      entries: [],
      totalCalories: 0,
      totalProtein: 0,
      totalCarbs: 0,
      totalFat: 0,
      water: 0,
      steps: 0,
      targetCalories: 0
    };
    current.steps = steps;
    await db.upsertLog(req.params.userId, date, current);
    res.json({ steps });
  });

  return router;
}
