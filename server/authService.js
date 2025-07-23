import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import { v4 as uuid } from 'uuid';

const JWT_SECRET = process.env.JWT_SECRET || 'nutritalk-secret';

export async function registerUser(db, user) {
  const { email, password, name } = user;
  if (!email || !password || !name) throw new Error('Missing fields');
  // Évite la double inscription avec le même email
  if (await db.getUserByEmail(email)) {
    throw new Error('Email already registered');
  }
  // Hash du mot de passe AVANT insertion
  const hashed = await bcrypt.hash(password, 10);
  const newUser = { id: uuid(), email, name, password: hashed };
  await db.addUser(newUser);
  // Création du JWT pour l'utilisateur
  const token = jwt.sign({ userId: newUser.id }, JWT_SECRET, { expiresIn: '7d' });
  // Renvoie l'utilisateur sans le hash du mot de passe
  const { password: _pw, ...safeUser } = newUser;
  return { user: safeUser, token };
}

export async function loginUser(db, email, password, remember = false) {
  if (!email || !password) throw new Error('Missing fields');
  const user = await db.getUserByEmail(email);
  if (!user) throw new Error('Invalid credentials');
  // Vérification du hash du mot de passe
  const valid = await bcrypt.compare(password, user.password);
  if (!valid) throw new Error('Invalid credentials');
  // Création du JWT pour l'utilisateur
  const expiresIn = remember ? '30d' : '7d';
  const token = jwt.sign({ userId: user.id }, JWT_SECRET, { expiresIn });
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

