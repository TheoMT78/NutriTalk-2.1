import express from 'express';
import { verifyToken } from './authService.js';

export default function createDeviceSyncRouter(db) {
  const router = express.Router();

  async function fetchSteps(provided) {
    // Tentative d'intégration avec l'API Santé (Apple Health / Google Fit).
    // En production, remplacer cette implémentation par un appel réel.
    if (
      typeof provided === 'number' &&
      !Number.isNaN(provided) &&
      provided > 0 &&
      provided <= 100000
    ) {
      return provided;
    }
    return 0;
  }

  router.post('/:userId', async (req, res) => {
    const auth = req.headers.authorization || '';
    const token = auth.startsWith('Bearer ') ? auth.slice(7) : null;
    const decoded = token ? verifyToken(token) : null;
    if (!decoded || decoded.userId !== req.params.userId) {
      return res.status(401).json({ error: 'Unauthorized' });
    }
    const { date, steps: provided } = req.body || {};
    if (!date) return res.status(400).json({ error: 'Missing date' });

    const current = (await db.getLogs(req.params.userId, date)) || {
      entries: [],
      totalCalories: 0,
      totalProtein: 0,
      totalCarbs: 0,
      totalFat: 0,
      water: 0,
      steps: 0,
      targetCalories: 0,
      lastSyncAt: 0
    };

    const now = Date.now();
    if (current.steps > 0 && current.lastSyncAt && now - current.lastSyncAt < 24 * 60 * 60 * 1000) {
      return res.json({ steps: current.steps });
    }
    if (current.lastSyncAt && now - current.lastSyncAt < 5 * 60 * 1000) {
      // Evite les re-sync trop fréquentes en cas d'échec précédent
      return res.json({ steps: current.steps });
    }

    let steps = 0;
    try {
      const result = await fetchSteps(provided);
      if (
        typeof result === 'number' &&
        !Number.isNaN(result) &&
        result > 0 &&
        result <= 100000
      ) {
        steps = result;
      }
    } catch (err) {
      console.error('deviceSync fetchSteps error:', err);
    }

    current.lastSyncAt = now;
    const stepsToStore = steps > current.steps ? steps : current.steps;
    current.steps = stepsToStore;
    try {
      await db.upsertLog(req.params.userId, date, current);
    } catch (err) {
      console.error('deviceSync database error:', err);
    }
    res.json({ steps: current.steps });
  });

  return router;
}
