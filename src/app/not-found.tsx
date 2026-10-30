import Link from 'next/link';
import { Logo } from '@/components/Logo';
import styles from './not-found.module.css';

export default function NotFound() {
  return (
    <main id="main" className={styles.wrap} tabIndex={-1}>
      <div className={styles.card}>
        <Link href="/" className={`logo-link ${styles.logoLink}`} aria-label="TrustGuard AI — на главную">
          <Logo className={styles.logo} />
        </Link>
        <p className={styles.code} aria-hidden="true">
          404
        </p>
        <h1 className={styles.title}>Такой страницы нет</h1>
        <Link href="/" className="btn btn-primary shine">
          На главную
        </Link>
      </div>
    </main>
  );
}
