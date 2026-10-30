/**
 * Яндекс Метрика. Счётчик подключается только после «Принять все» в баннере cookie
 * (см. components/CookieBanner.tsx). Без NEXT_PUBLIC_YM_ID аналитика выключена,
 * а баннер показывает короткое уведомление о необходимых cookie.
 */

export const YM_ID: number | null = (() => {
  const raw = process.env.NEXT_PUBLIC_YM_ID;
  const id = raw ? Number(raw) : NaN;
  return Number.isFinite(id) && id > 0 ? id : null;
})();

/** Цели Метрики — заведите их в интерфейсе счётчика как «JavaScript-событие» с этими идентификаторами. */
export const GOALS = {
  pilotClick: 'pilot_cta_click',
  questionClick: 'question_cta_click',
  leadSubmit: 'lead_form_submit',
} as const;

type YmFunction = ((...args: unknown[]) => void) & { a?: unknown[]; l?: number };

declare global {
  interface Window {
    ym?: YmFunction;
  }
}

export function reachGoal(goal: string) {
  if (typeof window === 'undefined' || !YM_ID || typeof window.ym !== 'function') return;
  window.ym(YM_ID, 'reachGoal', goal);
}
