import mongoose from 'mongoose';
import { createDb } from '../server/db.js';

(async () => {
  const db = await createDb();
  if (db.type !== 'mongo') {
    console.log('[test-db] not using MongoDB', { type: db.type });
    return;
  }
  try {
    const id = 'test-' + Date.now();
    const user = {
      id,
      name: 'Tester',
      email: `tester-${id}@example.com`,
      password: 'password123'
    };
    await db.addUser(user);
    console.log('[test-db] user inserted', { id, dbName: db.dbName });
    await mongoose.connection.collection('users').deleteOne({ id });
    console.log('[test-db] cleanup done');
  } catch (err) {
    console.error('[test-db] write failed', err);
  } finally {
    await mongoose.disconnect();
  }
})();
