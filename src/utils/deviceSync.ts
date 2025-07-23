import { API_BASE, getAuthToken } from './api';
import { safeJson } from './safeJson';
import { getDeviceSteps } from './getDeviceSteps';

export interface DeviceSyncOptions {
  userId: string;
  date: string;
}

export async function deviceSync({ userId, date }: DeviceSyncOptions): Promise<number> {
  const token = getAuthToken();
  if (!token) return 0;
  let localSteps = 0;
  try {
    localSteps = await getDeviceSteps(date);
  } catch (err) {
    console.error('getDeviceSteps failed', err);
  }
  try {
    const res = await fetch(`${API_BASE}/device-sync/${userId}`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${token}`
      },
      body: JSON.stringify({ date, steps: localSteps })
    });
    if (!res.ok) {
      console.error('deviceSync request failed', res.status, res.statusText);
      return 0;
    }
    const data = await safeJson<{ steps?: number }>(res);
    return data?.steps || 0;
  } catch (e) {
    console.error('deviceSync error', e);
    return 0;
  }
}
