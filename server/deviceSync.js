import express from 'express';
import { verifyToken } from './authService.js';

export default function createDeviceSyncRouter(db) {
  const router = express.Router();

  async function fetchSteps() {
    // Fonction simulant la récupération depuis Google Fit / Apple Health
    // Dans un vrai scénario, cette fonction pourrait échouer si
    // l'utilisateur refuse la permission ou si l'API tierce ne répond pas.
    if (Math.random() < 0.05) {
      // 5 % de chance d'échec pour simuler une erreur réseau ou permission refusée
      throw new Error('Failed to retrieve steps');
    }
    return Math.round(Math.random() * 3000) + 3000;
  }

  router.post('/:userId', async (req, res) => {
    const auth = req.headers.authorization || '';
    const token = auth.startsWith('Bearer ') ? auth.slice(7) : null;
    const decoded = token ? verifyToken(token) : null;
    if (!decoded || decoded.userId !== req.params.userId) {
      return res.status(401).json({ error: 'Unauthorized' });
    }
    const { date } = req.body || {};
    if (!date) return res.status(400).json({ error: 'Missing date' });

    let steps = 0;
    try {
      const result = await fetchSteps();
      if (typeof result === 'number' && !Number.isNaN(result) && result > 0) {
        steps = result;
      }
    } catch (err) {
      console.error('deviceSync fetchSteps error:', err);
    }

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
    try {
      await db.upsertLog(req.params.userId, date, current);
    } catch (err) {
      console.error('deviceSync database error:', err);
    }
    res.json({ steps });
  });

  return router;
}
