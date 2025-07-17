import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import { v4 as uuid } from 'uuid';

const JWT_SECRET = process.env.JWT_SECRET || 'nutritalk-secret';

export async function registerUser(db, user) {
  const { email, password, name } = user;
  if (!email || !password || !name) throw new Error('Missing fields');
  if (await db.getUserByEmail(email)) {
    throw new Error('Email already registered');
  }
  const hashed = await bcrypt.hash(password, 10);
  const newUser = { id: uuid(), email, name, password: hashed };
  await db.addUser(newUser);
  const token = jwt.sign({ userId: newUser.id }, JWT_SECRET, { expiresIn: '7d' });
  const { password: _pw, ...safeUser } = newUser;
  return { user: safeUser, token };
}

export async function loginUser(db, email, password) {
  if (!email || !password) throw new Error('Missing fields');
  const user = await db.getUserByEmail(email);
  if (!user) throw new Error('Invalid credentials');
  const valid = await bcrypt.compare(password, user.password);
  if (!valid) throw new Error('Invalid credentials');
  const token = jwt.sign({ userId: user.id }, JWT_SECRET, { expiresIn: '7d' });
  const { password: _pw, ...safeUser } = user;
  return { user: safeUser, token };
}

export function verifyToken(token) {
  try {
    return jwt.verify(token, JWT_SECRET);
  } catch {
    return null;
  }
}

