'use client';

import { nav, pilotBadge, tagline } from '@/content/site';
import { CtaLink } from './CtaLink';
import { Logo } from './Logo';
import { useActiveSection } from './useActiveSection';
import styles from './Rail.module.css';

const SECTION_IDS = nav.map((item) => item.id);

/** Левая колонка на экранах от 1024 px: логотип, разделы страницы с подсветкой текущего, статус набора пилотов. */
export function Rail() {
  const active = useActiveSection(SECTION_IDS);

  return (
    <header className={styles.rail}>
      <div className={styles.brand}>
        <a href="#top" className={`logo-link ${styles.logoLink}`} aria-label="TrustGuard AI — к началу страницы">
          <Logo className={styles.logo} />
        </a>
        <p className={styles.tagline}>{tagline}</p>
      </div>

      <nav aria-label="Разделы страницы" className={styles.nav}>
        {nav.map((item) => {
          const isActive = active === item.id;
          return (
            <a
              key={item.id}
              href={`#${item.id}`}
              className={isActive ? `${styles.link} ${styles.linkActive}` : styles.link}
              aria-current={isActive ? 'location' : undefined}
            >
              <span className={styles.num} aria-hidden="true">
                {item.num}
              </span>
              {item.label}
            </a>
          );
        })}
      </nav>

      <div className={styles.bottom}>
        <a href="#pilot" className={styles.badge}>
          <span className="live-dot" aria-hidden="true" />
          {pilotBadge}
        </a>
        {/* Пока форма не помещается справа (1024–1279 px), кнопка заявки живёт здесь */}
        <CtaLink className={`btn btn-primary btn-block shine ${styles.cta}`}>Обсудить пилот</CtaLink>
      </div>
    </header>
  );
}
