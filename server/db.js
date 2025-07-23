import { Low } from 'lowdb';
import { JSONFile } from 'lowdb/node';
import mongoose from 'mongoose';
import { fileURLToPath } from 'url';
import path from 'path';

export async function createDb() {
  const uri = process.env.MONGODB_URI && process.env.MONGODB_URI.trim();
  if (uri) {
    const dbName = process.env.MONGODB_DBNAME || 'nutritalk';
    console.log('[db] connecting to MongoDB', { dbName });

    try {
      await mongoose.connect(uri, {
        useNewUrlParser: true,
        useUnifiedTopology: true,
        dbName
      });
      console.log('[db] MongoDB connected to', dbName);
    } catch (err) {
      console.error('[db] MongoDB connection error', err);
      throw err;
    }

    const userSchema = new mongoose.Schema(
      {
        id: { type: String, required: true },
        name: { type: String, required: true },
        email: { type: String, required: true },
        password: { type: String, required: true },
        dateOfBirth: { type: String },
        gender: { type: String },
        height: { type: Number },
        weight: { type: Number },
        activityLevel: { type: String },
        goal: { type: String },
        dailyCalories: { type: Number },
        dailyProtein: { type: Number },
        dailyCarbs: { type: Number },
        dailyFat: { type: Number }
      },
      { collection: 'users' }
    );

    const logSchema = new mongoose.Schema(
      {
        userId: String,
        date: String,
        data: Object
      },
      { collection: 'logs' }
    );

    const weightSchema = new mongoose.Schema(
      {
        userId: String,
        data: Array
      },
      { collection: 'weights' }
    );

    const User = mongoose.models.User || mongoose.model('User', userSchema);
    const Log = mongoose.models.Log || mongoose.model('Log', logSchema);
    const Weight = mongoose.models.Weight || mongoose.model('Weight', weightSchema);

    return {
      type: 'mongo',
      dbName,
      client: mongoose.connection,
      async getUserByEmail(email) {
        return User.findOne({ email }).lean();
      },
      async addUser(user) {
        console.log('[db] addUser', { email: user.email });
        try {
          const doc = await User.create(user);
          console.log('[db] insert success', doc._id);
          return doc;
        } catch (err) {
          console.error('[db] insert error', err);
          throw err;
        }
      },
      // PATCH SÉCURITÉ : on ignore le password lors d’un update user
      async updateUser(id, data) {
        // NE JAMAIS mettre à jour le password ici !
        const { password, ...safeData } = data;
        await User.updateOne({ id }, { $set: safeData });
      },
      async getUserById(id) {
        return User.findOne({ id }).lean();
      },
      async getLogs(userId, date) {
        if (date) {
          const entry = await Log.findOne({ userId, date }).lean();
          return entry ? entry.data : null;
        }
        return Log.find({ userId }).lean();
      },
      async upsertLog(userId, date, data) {
        await Log.updateOne(
          { userId, date },
          { $set: { data } },
          { upsert: true }
        );
      },
      async getWeights(userId) {
        const w = await Weight.findOne({ userId }).lean();
        return w ? w.data : [];
      },
      async upsertWeights(userId, data) {
        await Weight.updateOne(
          { userId },
          { $set: { data } },
          { upsert: true }
        );
      },
      async editFoodQuantity({ userId, foodId, newQuantity, newUnit }) {
        const today = new Date().toISOString().split('T')[0];
        const doc = await Log.findOne({ userId, date: today }).lean();
        if (!doc) return null;
        const log = doc.data;
        const idx = log.entries.findIndex(e => e.id === foodId);
        if (idx === -1) return null;
        const entry = log.entries[idx];
        const ratio = newQuantity / (entry.quantity || 1);
        const updated = {
          ...entry,
          quantity: newQuantity,
          unit: newUnit || entry.unit,
          calories: Math.round(entry.calories * ratio * 10) / 10,
          protein: Math.round(entry.protein * ratio * 10) / 10,
          carbs: Math.round(entry.carbs * ratio * 10) / 10,
          fat: Math.round(entry.fat * ratio * 10) / 10
        };
        log.entries[idx] = updated;
        log.totalCalories =
          Math.round((log.totalCalories - entry.calories + updated.calories) * 10) / 10;
        log.totalProtein =
          Math.round((log.totalProtein - entry.protein + updated.protein) * 10) / 10;
        log.totalCarbs =
          Math.round((log.totalCarbs - entry.carbs + updated.carbs) * 10) / 10;
        log.totalFat =
          Math.round((log.totalFat - entry.fat + updated.fat) * 10) / 10;
        await Log.updateOne({ userId, date: today }, { $set: { data: log } }, { upsert: true });
        return updated;
      }
    };
  }

  console.warn('[db] MONGODB_URI not set, falling back to local JSON file');

  const __filename = fileURLToPath(import.meta.url);
  const __dirname = path.dirname(__filename);
  const dbFile = process.env.DB_FILE || path.join(__dirname, 'db.json');
  const low = new Low(new JSONFile(dbFile), { users: [], logs: [], weights: [] });
  await low.read();
  console.log('[db] Using local database file', dbFile);
  if (!low.data) low.data = { users: [], logs: [], weights: [] };

  return {
    type: 'lowdb',
    dbFile,
    async getUserByEmail(email) {
      await low.read();
      return low.data.users.find(u => u.email === email);
    },
    async addUser(user) {
      console.log('[db] addUser (local)', { email: user.email });
      low.data.users.push(user);
      await low.write();
    },
    // PATCH SÉCURITÉ aussi pour mode fichier JSON
    async updateUser(id, data) {
      await low.read();
      const idx = low.data.users.findIndex(u => u.id === id);
      if (idx !== -1) {
        const { password, ...safeData } = data;
        low.data.users[idx] = { ...low.data.users[idx], ...safeData };
        await low.write();
      }
    },
    async getUserById(id) {
      await low.read();
      return low.data.users.find(u => u.id === id);
    },
    async getLogs(userId, date) {
      await low.read();
      if (date) {
        const entry = low.data.logs.find(l => l.userId === userId && l.date === date);
        return entry ? entry.data : null;
      }
      return low.data.logs.filter(l => l.userId === userId);
    },
    async upsertLog(userId, date, data) {
      await low.read();
      const idx = low.data.logs.findIndex(l => l.userId === userId && l.date === date);
      const entry = { userId, date, data };
      if (idx === -1) low.data.logs.push(entry); else low.data.logs[idx] = entry;
      await low.write();
    },
    async getWeights(userId) {
      await low.read();
      const w = low.data.weights.find(w => w.userId === userId);
      return w ? w.data : [];
    },
    async upsertWeights(userId, data) {
      await low.read();
      const idx = low.data.weights.findIndex(w => w.userId === userId);
      const entry = { userId, data };
      if (idx === -1) low.data.weights.push(entry); else low.data.weights[idx] = entry;
      await low.write();
    },
    async editFoodQuantity({ userId, foodId, newQuantity, newUnit }) {
      await low.read();
      const today = new Date().toISOString().split('T')[0];
      const logIdx = low.data.logs.findIndex(l => l.userId === userId && l.date === today);
      if (logIdx === -1) return null;
      const log = low.data.logs[logIdx].data;
      const idx = log.entries.findIndex(e => e.id === foodId);
      if (idx === -1) return null;
      const entry = log.entries[idx];
      const ratio = newQuantity / (entry.quantity || 1);
      const updated = {
        ...entry,
        quantity: newQuantity,
        unit: newUnit || entry.unit,
        calories: Math.round(entry.calories * ratio * 10) / 10,
        protein: Math.round(entry.protein * ratio * 10) / 10,
        carbs: Math.round(entry.carbs * ratio * 10) / 10,
        fat: Math.round(entry.fat * ratio * 10) / 10
      };
      log.entries[idx] = updated;
      log.totalCalories =
        Math.round((log.totalCalories - entry.calories + updated.calories) * 10) / 10;
      log.totalProtein =
        Math.round((log.totalProtein - entry.protein + updated.protein) * 10) / 10;
      log.totalCarbs =
        Math.round((log.totalCarbs - entry.carbs + updated.carbs) * 10) / 10;
      log.totalFat =
        Math.round((log.totalFat - entry.fat + updated.fat) * 10) / 10;
      low.data.logs[logIdx] = { userId, date: today, data: log };
      await low.write();
      return updated;
    }
  };
}
