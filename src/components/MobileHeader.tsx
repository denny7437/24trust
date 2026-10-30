'use client';

import { useCallback, useEffect, useRef, useState, type KeyboardEvent } from 'react';
import { fsiShort, nav, pilotBadge } from '@/content/site';
import { CtaLink } from './CtaLink';
import { Icon } from './Icon';
import { Logo } from './Logo';
import styles from './MobileHeader.module.css';

const FOCUSABLE = 'a[href], button:not([disabled]), [tabindex]:not([tabindex="-1"])';

/** Шапка до 1024 px: логотип, кнопка заявки всегда на экране, меню разделов на весь экран. */
export function MobileHeader() {
  const [open, setOpen] = useState(false);
  const menuRef = useRef<HTMLDivElement>(null);
  const toggleRef = useRef<HTMLButtonElement>(null);
  const restoreFocus = useRef(false);

  /** Закрыть меню. После Esc и крестика фокус возвращается на кнопку меню, после перехода по ссылке — нет. */
  const close = useCallback((returnFocus: boolean) => {
    restoreFocus.current = returnFocus;
    setOpen(false);
  }, []);

  useEffect(() => {
    if (open) {
      const root = document.documentElement;
      const previous = root.style.overflow;
      root.style.overflow = 'hidden';
      menuRef.current?.querySelector<HTMLElement>('[data-autofocus]')?.focus();
      return () => {
        root.style.overflow = previous;
      };
    }
    if (restoreFocus.current) {
      restoreFocus.current = false;
      toggleRef.current?.focus({ preventScroll: true });
    }
    return undefined;
  }, [open]);

  // На широком экране меню не нужно: закрываем, если окно расширили
  useEffect(() => {
    const query = window.matchMedia('(min-width: 1024px)');
    const onChange = () => {
      if (query.matches) setOpen(false);
    };
    query.addEventListener('change', onChange);
    return () => query.removeEventListener('change', onChange);
  }, []);

  const onKeyDown = (event: KeyboardEvent<HTMLDivElement>) => {
    if (event.key === 'Escape') {
      event.preventDefault();
      close(true);
      return;
    }
    if (event.key !== 'Tab' || !menuRef.current) return;
    const items = Array.from(menuRef.current.querySelectorAll<HTMLElement>(FOCUSABLE));
    if (items.length === 0) return;
    const first = items[0];
    const last = items[items.length - 1];
    if (event.shiftKey && document.activeElement === first) {
      event.preventDefault();
      last.focus();
    } else if (!event.shiftKey && document.activeElement === last) {
      event.preventDefault();
      first.focus();
    }
  };

  return (
    <>
      <header className={styles.header}>
        <a href="#top" className={`logo-link ${styles.logoLink}`} aria-label="TrustGuard AI — к началу страницы">
          <Logo withTag={false} className={styles.logo} />
        </a>
        <div className={styles.actions}>
          <CtaLink className={`btn btn-primary btn-sm ${styles.cta}`}>Обсудить пилот</CtaLink>
          <button
            ref={toggleRef}
            type="button"
            className={styles.iconButton}
            aria-label="Открыть меню"
            aria-expanded={open}
            aria-controls="mobile-menu"
            onClick={() => setOpen(true)}
          >
            <Icon name="menu" strokeWidth={2} />
          </button>
        </div>
      </header>

      {open ? (
        <div
          id="mobile-menu"
          ref={menuRef}
          className={styles.menu}
          role="dialog"
          aria-modal="true"
          aria-label="Меню"
          onKeyDown={onKeyDown}
        >
          <div className={styles.menuTop}>
            <a
              href="#top"
              className={`logo-link ${styles.logoLink}`}
              aria-label="TrustGuard AI — к началу страницы"
              onClick={() => close(false)}
            >
              <Logo withTag={false} className={styles.logo} />
            </a>
            <button
              type="button"
              className={`${styles.iconButton} ${styles.close}`}
              aria-label="Закрыть меню"
              onClick={() => close(true)}
              data-autofocus
            >
              <Icon name="close" strokeWidth={2} />
            </button>
          </div>

          <nav aria-label="Разделы страницы" className={styles.list}>
            {nav.map((item, index) => (
              <a
                key={item.id}
                href={`#${item.id}`}
                className={styles.link}
                style={{ animationDelay: `${0.04 + index * 0.03}s` }}
                onClick={() => close(false)}
              >
                <span className={styles.num} aria-hidden="true">
                  {item.num}
                </span>
                {item.label}
              </a>
            ))}
          </nav>

          <div className={styles.sheet}>
            <p className={styles.sheetNote}>
              <span className="live-dot" aria-hidden="true" />
              {pilotBadge}
            </p>
            <CtaLink className="btn btn-primary btn-block" onNavigate={() => close(false)}>
              Обсудить пилот
            </CtaLink>
            <p className={styles.sheetFoot}>{fsiShort}</p>
          </div>
        </div>
      ) : null}
    </>
  );
}
