export async function getDeviceSteps(date: string): Promise<number> {
  try {
    const nav: any = typeof navigator !== 'undefined' ? navigator : null;
    if (nav?.health?.getDailyStepCount) {
      const res = await nav.health.getDailyStepCount({ date });
      if (res && typeof res.steps === 'number') {
        return res.steps;
      }
    }
  } catch (err) {
    console.error('getDeviceSteps error', err);
  }
  return 0;
}
