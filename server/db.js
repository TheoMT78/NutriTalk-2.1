import { Low } from 'lowdb';
import { JSONFile } from 'lowdb/node';
import { MongoClient } from 'mongodb';
import { fileURLToPath } from 'url';
import path from 'path';

export async function createDb() {
  if (process.env.MONGODB_URI) {
    const uri = process.env.MONGODB_URI;
    const client = new MongoClient(uri);
    await client.connect();
    const database = client.db();
    return {
      type: 'mongo',
      client,
      async getUserByEmail(email) {
        return database.collection('users').findOne({ email });
      },
      async addUser(user) {
        await database.collection('users').insertOne(user);
      },
      async updateUser(id, data) {
        await database.collection('users').updateOne({ id }, { $set: data });
      },
      async getUserById(id) {
        return database.collection('users').findOne({ id });
      },
      async getLogs(userId, date) {
        if (date) {
          const entry = await database.collection('logs').findOne({ userId, date });
          return entry ? entry.data : null;
        }
        return database.collection('logs').find({ userId }).toArray();
      },
      async upsertLog(userId, date, data) {
        await database.collection('logs').updateOne(
          { userId, date },
          { $set: { data } },
          { upsert: true }
        );
      },
      async getWeights(userId) {
        const w = await database.collection('weights').findOne({ userId });
        return w ? w.data : [];
      },
      async upsertWeights(userId, data) {
        await database.collection('weights').updateOne(
          { userId },
          { $set: { data } },
          { upsert: true }
        );
      }
    };
  }

  const __filename = fileURLToPath(import.meta.url);
  const __dirname = path.dirname(__filename);
  const dbFile = process.env.DB_FILE || path.join(__dirname, 'db.json');
  const low = new Low(new JSONFile(dbFile), { users: [], logs: [], weights: [] });
  await low.read();
  if (!low.data) low.data = { users: [], logs: [], weights: [] };

  return {
    type: 'lowdb',
    async getUserByEmail(email) {
      await low.read();
      return low.data.users.find(u => u.email === email);
    },
    async addUser(user) {
      low.data.users.push(user);
      await low.write();
    },
    async updateUser(id, data) {
      await low.read();
      const idx = low.data.users.findIndex(u => u.id === id);
      if (idx !== -1) {
        low.data.users[idx] = { ...low.data.users[idx], ...data };
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
    }
  };
}
