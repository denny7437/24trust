import Link from 'next/link';
import type { ReactNode } from 'react';
import { Footer } from './Footer';
import { Icon } from './Icon';
import { Logo } from './Logo';
import { Fill } from './ui';
import styles from './LegalPage.module.css';

type LegalPageProps = {
  title: string;
  /** Строка «Редакция от …» */
  edition?: string;
  children: ReactNode;
};

/**
 * Таблица в юридическом тексте. На планшете прокручивается по горизонтали,
 * на телефоне строки превращаются в карточки — подписи берутся из data-label у ячеек.
 */
export function LegalTable({ label, children }: { label: string; children: ReactNode }) {
  return (
    <div className={styles.tableWrap} role="region" aria-label={label} tabIndex={0}>
      <table>{children}</table>
    </div>
  );
}

/** Оболочка юридических страниц: шапка с логотипом, документ, подвал. */
export function LegalPage({ title, edition, children }: LegalPageProps) {
  return (
    <>
      <header className={styles.top}>
        <Link href="/" className={`logo-link ${styles.logoLink}`} aria-label="TrustGuard AI — на главную">
          <Logo className={styles.logo} />
        </Link>
        <Link href="/" className={`btn btn-ghost btn-sm ${styles.back}`}>
          <Icon name="arrowLeft" strokeWidth={2} />
          На главную
        </Link>
      </header>
      <main id="main" className={styles.main} tabIndex={-1}>
        <article className={styles.doc}>
          <h1 className={styles.title}>{title}</h1>
          {edition ? (
            <p className={styles.edition}>
              <Fill text={edition} />
            </p>
          ) : null}
          {children}
        </article>
      </main>
      <Footer />
    </>
  );
}
