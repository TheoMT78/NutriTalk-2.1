export interface SimpleFood {
  name: string;
}

export function levenshtein(a: string, b: string): number {
  const m = a.length;
  const n = b.length;
  const dp: number[][] = Array.from({ length: m + 1 }, () => Array(n + 1).fill(0));
  for (let i = 0; i <= m; i++) dp[i][0] = i;
  for (let j = 0; j <= n; j++) dp[0][j] = j;
  for (let i = 1; i <= m; i++) {
    for (let j = 1; j <= n; j++) {
      const cost = a[i - 1] === b[j - 1] ? 0 : 1;
      dp[i][j] = Math.min(
        dp[i - 1][j] + 1,
        dp[i][j - 1] + 1,
        dp[i - 1][j - 1] + cost
      );
    }
  }
  return dp[m][n];
}

export function findClosestFood<T extends SimpleFood>(query: string, foods: T[]): T | null {
  let best: T | null = null;
  let bestScore = Infinity;
  const q = query.toLowerCase();
  for (const food of foods) {
    const score = levenshtein(q, food.name.toLowerCase());
    if (score < bestScore) {
      bestScore = score;
      best = food;
    }
  }
  if (bestScore <= q.length / 2) return best;
  return null;
}
