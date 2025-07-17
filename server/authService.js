import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import { v4 as uuid } from 'uuid';

const JWT_SECRET = process.env.JWT_SECRET || 'nutritalk-secret';

export async function registerUser(db, user) {
  const { password: pw, ...safeInput } = user;
  console.log('[registerUser] received', safeInput);
  if (await db.getUserByEmail(user.email)) {
    console.warn('[registerUser] email already exists');
    throw new Error('Email already registered');
  }
  const hashed = await bcrypt.hash(user.password, 10);
  const newUser = { id: uuid(), ...user, password: hashed };
  try {
    const result = await db.addUser(newUser);
    const location = db.type === 'mongo'
      ? `MongoDB ${db.dbName}.users`
      : `lowdb ${db.dbFile}`;
    console.log('[registerUser] stored in', location, result ? `id=${result.id || result._id}` : '');
    const token = jwt.sign({ userId: newUser.id }, JWT_SECRET, { expiresIn: '7d' });
    const { password, ...safe } = newUser;
    return { user: safe, token };
  } catch (err) {
    console.error('[registerUser] insertion error', err);
    throw err;
  }
}

export async function loginUser(db, email, password) {
  const user = await db.getUserByEmail(email);
  if (!user) throw new Error('Invalid credentials');
  let valid = false;
  if (user.password && user.password.startsWith('$2')) {
    valid = await bcrypt.compare(password, user.password);
  } else if (password === user.password) {
    const hashed = await bcrypt.hash(password, 10);
    await db.updateUser(user.id, { password: hashed });
    user.password = hashed;
    valid = true;
  }
  if (!valid) throw new Error('Invalid credentials');
  const token = jwt.sign({ userId: user.id }, JWT_SECRET, { expiresIn: '7d' });
  const { password: pw, ...safe } = user;
  return { user: safe, token };
}

export function verifyToken(token) {
  try {
    return jwt.verify(token, JWT_SECRET);
  } catch {
    return null;
  }
}
