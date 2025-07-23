export async function getDeviceSteps(date: string): Promise<number> {
  try {
    const nav =
      typeof navigator !== 'undefined'
        ? (navigator as unknown as {
            health?: {
              getDailyStepCount?: (opts: { date: string }) => Promise<{ steps: number }>;
            };
          })
        : null;
    if (nav?.health?.getDailyStepCount) {
      const res = await nav.health.getDailyStepCount({ date });
      if (res && typeof res.steps === 'number') {
        return res.steps;
      }
    }

      const webkit =
        typeof window !== 'undefined'
          ? (window as unknown as {
              webkit?: { messageHandlers?: Record<string, unknown> };
            }).webkit
          : undefined;
    if (webkit?.messageHandlers?.getDailyStepCount) {
      const handler = webkit.messageHandlers.getDailyStepCount;
      try {
        const result = handler.postMessage({ date });
        if (result && typeof result.then === 'function') {
          const data = await result;
          if (data && typeof data.steps === 'number') return data.steps;
          if (typeof data === 'number') return data;
        }
      } catch (err) {
        console.error('webkit getDailyStepCount error', err);
      }
    }
  } catch (err) {
    console.error('getDeviceSteps error', err);
  }
  return 0;
}
