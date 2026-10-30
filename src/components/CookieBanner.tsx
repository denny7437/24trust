'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useEffect, useRef, useState, useSyncExternalStore, type ReactNode } from 'react';
import { cookieText } from '@/content/site';
import { YM_ID } from '@/lib/analytics';
import {
  clearAnalyticsCookies,
  readCookieChoice,
  writeCookieChoice,
  type CookieChoice,
} from '@/lib/cookie-consent';
import { COOKIE_SETTINGS_EVENT, openCookieSettings } from '@/lib/events';
import styles from './CookieBanner.module.css';

/* Выбор посетителя живёт в cookie; компонент подписан на его изменения */
const listeners = new Set<() => void>();
const subscribe = (listener: () => void) => {
  listeners.add(listener);
  return () => {
    listeners.delete(listener);
  };
};
const notify = () => listeners.forEach((listener) => listener());
/** На сервере выбор неизвестен — баннер не рендерится, чтобы не мешать гидратации. */
const getServerChoice = (): CookieChoice | null | undefined => undefined;

/** Подключает Яндекс Метрику. Рендерится только после «Принять все». */
function Metrika({ id }: { id: number }) {
  const pathname = usePathname();
  const firstHit = useRef(true);

  useEffect(() => {
    if (typeof window.ym !== 'function') {
      const queue = function (...args: unknown[]) {
        (queue.a = queue.a || []).push(args);
      } as NonNullable<Window['ym']>;
      queue.l = Date.now();
      window.ym = queue;
    }
    const src = 'https://mc.yandex.ru/metrika/tag.js';
    if (!document.querySelector(`script[src="${src}"]`)) {
      const script = document.createElement('script');
      script.async = true;
      script.src = src;
      document.head.appendChild(script);
    }
    window.ym?.(id, 'init', {
      clickmap: true,
      trackLinks: true,
      accurateTrackBounce: true,
      webvisor: false,
    });
  }, [id]);

  // Переходы между страницами без перезагрузки — отдельные просмотры
  useEffect(() => {
    if (firstHit.current) {
      firstHit.current = false;
      return;
    }
    window.ym?.(id, 'hit', window.location.href);
  }, [id, pathname]);

  return null;
}

/**
 * Баннер cookie. Пока посетитель не нажал «Принять все», Метрика не загружается.
 * Без NEXT_PUBLIC_YM_ID баннер — короткое уведомление о необходимых cookie с кнопкой «Понятно».
 */
export function CookieBanner() {
  const choice = useSyncExternalStore<CookieChoice | null | undefined>(subscribe, readCookieChoice, getServerChoice);
  const [settingsOpen, setSettingsOpen] = useState(false);
  const analyticsAvailable = YM_ID !== null;
  const open = choice === null || settingsOpen;

  useEffect(() => {
    const onOpen = () => setSettingsOpen(true);
    window.addEventListener(COOKIE_SETTINGS_EVENT, onOpen);
    return () => window.removeEventListener(COOKIE_SETTINGS_EVENT, onOpen);
  }, []);

  const save = (next: CookieChoice) => {
    const previous = choice;
    writeCookieChoice(next);
    setSettingsOpen(false);
    notify();
    // Отозвали согласие на аналитику — удаляем cookie Метрики и перезагружаем страницу без счётчика
    if (previous === 'all' && next === 'necessary') {
      clearAnalyticsCookies();
      window.location.reload();
    }
  };

  return (
    <>
      {choice === 'all' && YM_ID !== null ? <Metrika id={YM_ID} /> : null}
      {open && choice !== undefined ? (
        <section className={`on-dark ${styles.banner}`} aria-label="Уведомление о cookie">
          <p className={styles.text}>
            {analyticsAvailable ? cookieText.full : cookieText.short}{' '}
            <Link href="/privacy" className={styles.link}>
              {cookieText.link}
            </Link>
            .
          </p>
          <div className={styles.actions}>
            {analyticsAvailable ? (
              <>
                <button type="button" className={`btn btn-primary btn-sm ${styles.button}`} onClick={() => save('all')}>
                  {cookieText.acceptAll}
                </button>
                <button
                  type="button"
                  className={`btn btn-sm ${styles.button} ${styles.secondary}`}
                  onClick={() => save('necessary')}
                >
                  {cookieText.necessaryOnly}
                </button>
              </>
            ) : (
              <button type="button" className={`btn btn-primary btn-sm ${styles.button}`} onClick={() => save('necessary')}>
                {cookieText.ok}
              </button>
            )}
          </div>
        </section>
      ) : null}
    </>
  );
}

/** Ссылка «Настройки cookie» в подвале — снова открывает баннер. */
export function CookieSettingsButton({ className, children }: { className?: string; children: ReactNode }) {
  return (
    <button type="button" className={className} onClick={openCookieSettings}>
      {children}
    </button>
  );
}
