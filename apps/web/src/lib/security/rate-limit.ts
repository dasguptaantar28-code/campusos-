interface Bucket {
  count: number;
  resetAt: number;
}

const buckets = new Map<string, Bucket>();

export function checkRateLimit(key: string, limitPerMinute?: number): { allowed: boolean; remaining: number } {
  const limit = limitPerMinute ?? Number(process.env.CAMPUSOS_RATE_LIMIT_RPM ?? 120);
  const now = Date.now();
  const existing = buckets.get(key);

  if (!existing || now > existing.resetAt) {
    buckets.set(key, { count: 1, resetAt: now + 60_000 });
    return { allowed: true, remaining: Math.max(0, limit - 1) };
  }

  if (existing.count >= limit) {
    return { allowed: false, remaining: 0 };
  }

  existing.count += 1;
  return { allowed: true, remaining: Math.max(0, limit - existing.count) };
}
