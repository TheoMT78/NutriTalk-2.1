export function safeNumber(value: any, fallback = 0): number {
  return typeof value === 'number' && !Number.isNaN(value) ? value : fallback;
}
