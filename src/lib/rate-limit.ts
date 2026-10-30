/**
 * Простой лимит отправок формы с одного IP: окно в памяти процесса.
 * Подходит для одного инстанса. Если сайт работает в нескольких репликах —
 * вынесите лимит в nginx (limit_req) или Redis.
 */

const WINDOW_MS = 10 * 60 * 1000;
const MAX_HITS = 5;
const hits = new Map<string, number[]>();

export function allowRequest(key: string, now = Date.now()): boolean {
  const recent = (hits.get(key) ?? []).filter((t) => now - t < WINDOW_MS);
  if (recent.length >= MAX_HITS) {
    hits.set(key, recent);
    return false;
  }
  recent.push(now);
  hits.set(key, recent);
  if (hits.size > 5000) prune(now);
  return true;
}

function prune(now: number) {
  for (const [key, stamps] of hits) {
    if (stamps.every((t) => now - t >= WINDOW_MS)) hits.delete(key);
  }
}
