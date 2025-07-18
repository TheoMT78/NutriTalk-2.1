import { User, DailyLog } from '../types';
import { safeJson } from './safeJson';

// Use the production backend by default, falling back to localhost during development.
// Some hosts may set `VITE_API_URL` to the string "undefined" so handle that case
// to avoid requests like "undefined/api" which lead to empty responses.
const envUrl = import.meta.env.VITE_API_URL;
const API =
  envUrl && envUrl !== 'undefined'
    ? envUrl
    : import.meta.env.PROD
    ? 'https://nutritalk-2-0.onrender.com/api'
    : 'http://localhost:3001/api';

export const API_BASE = API;

let authToken: string | null =
  localStorage.getItem('token') || sessionStorage.getItem('token');

export function setAuthToken(token: string, remember: boolean) {
  authToken = token;
  if (remember) {
    localStorage.setItem('token', token);
    sessionStorage.removeItem('token');
  } else {
    sessionStorage.setItem('token', token);
    localStorage.removeItem('token');
  }
}

export function clearAuthToken() {
  authToken = null;
  localStorage.removeItem('token');
  sessionStorage.removeItem('token');
}

export function getAuthToken() {
  return authToken;
}

export function getUserIdFromToken(): string | null {
  if (!authToken) return null;
  try {
    const payload = JSON.parse(atob(authToken.split('.')[1]));
    return payload.userId as string;
  } catch {
    return null;
  }
}

function authHeaders(extra: Record<string, string> = {}) {
  return authToken ? { ...extra, Authorization: `Bearer ${authToken}` } : extra;
}

export async function login(email: string, password: string) {
  console.debug('POST', `${API}/login`);
  const res = await fetch(`${API}/login`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ email, password })
  }).catch(err => {
    console.error('Network error during login', err);
    throw err;
  });
  if (!res.ok) {
    console.error('Login failed', res.status, res.statusText);
    const err = (await safeJson<{ error?: string }>(res)) || {};
    throw new Error(err.error || 'Invalid credentials');
  }
  const raw = await safeJson(res);
  if (!raw) {
    console.error('Failed to parse login response');
    throw new Error('Invalid response from server');
  }
  let user: User | undefined;
  let token: string | undefined;
  if (Object.prototype.hasOwnProperty.call(raw as object, 'user')) {
    const d = raw as { user?: User; token?: string };
    user = d.user;
    token = d.token;
  } else {
    const d = raw as { token?: string } & Partial<User>;
    user = {
      ...d,
    } as User;
    token = d.token;
  }
  if (!user) {
    console.error('Invalid login payload', raw);
    throw new Error('Invalid response from server');
  }
  return { user, token };
}

export async function register(user: { name: string; email: string; password: string }) {
  console.debug('POST', `${API}/register`);
  const res = await fetch(`${API}/register`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(user)
  }).catch(err => {
    console.error('Network error during registration', err);
    throw err;
  });
  if (!res.ok) {
    console.error('Registration failed', res.status, res.statusText);
    const err = (await safeJson<{ error?: string }>(res)) || {};
    throw new Error(err.error || 'Registration failed');
  }
  const data = await safeJson<{ user?: User; token?: string }>(res);
  if (!data || !data.user || !data.token) {
    console.error('Invalid registration payload', data);
    throw new Error('Invalid response from server');
  }
  return data as { user: User; token: string };
}

export async function getDailyLog(userId: string, date: string) {
  const res = await fetch(`${API}/logs/${userId}/${date}`, {
    headers: authHeaders()
  }).catch(err => {
    console.error('Network error loading log', err);
    throw err;
  });
  if (!res.ok) {
    console.error('Failed to load log', res.status, res.statusText);
    throw new Error('Failed to load log');
  }
  return safeJson<DailyLog | null>(res);
}

export async function saveDailyLog(userId: string, date: string, log: DailyLog) {
  const res = await fetch(`${API}/logs/${userId}/${date}`, {
    method: 'POST',
    headers: authHeaders({ 'Content-Type': 'application/json' }),
    body: JSON.stringify(log)
  }).catch(err => {
    console.error('Network error saving log', err);
    throw err;
  });
  if (!res.ok) {
    console.error('Failed to save log', res.status, res.statusText);
    throw new Error('Failed to save log');
  }
  return safeJson<{ success: true }>(res);
}

export async function updateProfile(userId: string, data: Partial<User>) {
  const res = await fetch(`${API}/profile/${userId}`, {
    method: 'PUT',
    headers: authHeaders({ 'Content-Type': 'application/json' }),
    body: JSON.stringify(data)
  }).catch(err => {
    console.error('Network error updating profile', err);
    throw err;
  });
  if (!res.ok) {
    console.error('Failed to update profile', res.status, res.statusText);
    throw new Error('Failed to update profile');
  }
  const parsed = await safeJson<User>(res);
  if (!parsed) {
    console.error('Failed to parse profile update response');
  }
  return parsed;
}

export async function getProfile(userId: string) {
  const res = await fetch(`${API}/profile/${userId}`, {
    headers: authHeaders()
  }).catch(err => {
    console.error('Network error loading profile', err);
    throw err;
  });
  if (!res.ok) {
    console.error('Failed to load profile', res.status, res.statusText);
    throw new Error('Failed to load profile');
  }
  const data = await safeJson<User>(res);
  if (!data) {
    console.error('Failed to parse profile response');
  }
  return data;
}

export async function getWeightHistory(userId: string) {
  const res = await fetch(`${API}/weights/${userId}`, {
    headers: authHeaders()
  }).catch(err => {
    console.error('Network error loading weights', err);
    throw err;
  });
  if (!res.ok) {
    console.error('Failed to load weights', res.status, res.statusText);
    throw new Error('Failed to load weights');
  }
  const data = await safeJson<{ date: string; weight: number }[]>(res);
  if (!data) {
    console.error('Failed to parse weights response');
  }
  return data;
}

export async function saveWeightHistory(userId: string, history: { date: string; weight: number }[]) {
  const res = await fetch(`${API}/weights/${userId}`, {
    method: 'POST',
    headers: authHeaders({ 'Content-Type': 'application/json' }),
    body: JSON.stringify(history)
  }).catch(err => {
    console.error('Network error saving weights', err);
    throw err;
  });
  if (!res.ok) {
    console.error('Failed to save weights', res.status, res.statusText);
    throw new Error('Failed to save weights');
  }
  const data = await safeJson<{ success: true }>(res);
  if (!data) {
    console.error('Failed to parse save weights response');
  }
  return data;
}

export async function syncAll(userId: string) {
  const res = await fetch(`${API}/sync/${userId}`, {
    headers: authHeaders()
  }).catch(err => {
    console.error('Network error during sync', err);
    throw err;
  });
  if (!res.ok) {
    console.error('Failed to sync', res.status, res.statusText);
    throw new Error('Failed to sync');
  }
  const data = await safeJson<{ profile: User; logs: unknown; weights: unknown }>(res);
  if (!data) {
    console.error('Failed to parse sync response');
  }
  return data;
}

export interface WebNutritionResult {
  title: string;
  link: string;
  snippet: string;
}

export async function searchNutritionLinks(query: string): Promise<WebNutritionResult[]> {
  const base = API_BASE.endsWith('/api') ? API_BASE.slice(0, -4) : API_BASE;
  try {
    const res = await fetch(`${base}/search-nutrition?q=${encodeURIComponent(query)}`);
    if (!res.ok) {
      console.error('search-nutrition request failed', res.status, res.statusText);
      return [];
    }
    const data = await safeJson<WebNutritionResult[]>(res);
    return data || [];
  } catch (e) {
    console.error('searchNutritionLinks error', e);
    return [];
  }
}
