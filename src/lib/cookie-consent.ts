/** Выбор посетителя в баннере cookie. Хранится в необходимой cookie 12 месяцев. */

export type CookieChoice = 'all' | 'necessary';

export const CONSENT_COOKIE = 'tg_cookie_choice';
const MAX_AGE = 60 * 60 * 24 * 365;

export function readCookieChoice(): CookieChoice | null {
  if (typeof document === 'undefined') return null;
  const match = document.cookie.split('; ').find((part) => part.startsWith(`${CONSENT_COOKIE}=`));
  const value = match?.split('=')[1];
  return value === 'all' || value === 'necessary' ? value : null;
}

export function writeCookieChoice(choice: CookieChoice) {
  const secure = window.location.protocol === 'https:' ? '; Secure' : '';
  document.cookie = `${CONSENT_COOKIE}=${choice}; Max-Age=${MAX_AGE}; Path=/; SameSite=Lax${secure}`;
}

/** Удаляет cookie Метрики (_ym_*) после отзыва согласия на аналитику. */
export function clearAnalyticsCookies() {
  const names = document.cookie
    .split('; ')
    .map((part) => part.split('=')[0])
    .filter((name) => name.startsWith('_ym'));
  const host = window.location.hostname;
  const domains = ['', host, `.${host}`, `.${host.split('.').slice(-2).join('.')}`];
  for (const name of names) {
    for (const domain of domains) {
      document.cookie = `${name}=; Max-Age=0; Path=/${domain ? `; Domain=${domain}` : ''}`;
    }
  }
}
