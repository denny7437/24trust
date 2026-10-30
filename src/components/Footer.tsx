import Link from 'next/link';
import { company, footer, fsiShort, tagline } from '@/content/site';
import { CookieSettingsButton } from './CookieBanner';
import { Logo } from './Logo';
import { FsiLogo } from './sections/About';
import { CompanyEmail, CompanyPhone, CompanyTelegram, Fill } from './ui';
import styles from './Footer.module.css';

/** Год в копирайте — на момент сборки. */
const YEAR = new Date().getFullYear();

export function Footer() {
  return (
    <div className={styles.wrap}>
      <footer className={`on-dark ${styles.footer}`}>
        <div className={styles.grid}>
          <div className={`${styles.col} ${styles.brand}`}>
            <span role="img" aria-label={company.brand} className={styles.logo}>
              <Logo tone="dark" />
            </span>
            <p className={styles.muted}>{tagline}</p>
          </div>

          <nav aria-label="Навигация в подвале" className={`${styles.col} ${styles.nav}`}>
            <p className={styles.label}>{footer.navTitle}</p>
            {footer.nav.map((item) => (
              <a key={item.href} href={item.href} className={styles.link}>
                {item.label}
              </a>
            ))}
          </nav>

          <div className={`${styles.col} ${styles.contacts}`}>
            <p className={styles.label}>{footer.contactsTitle}</p>
            <p className={styles.text}>
              E-mail для заявок: <CompanyEmail className={styles.inlineLink} />
              <br />
              Телефон: <CompanyPhone className={styles.inlineLink} />
              <br />
              Telegram: <CompanyTelegram className={styles.inlineLink} />
            </p>
          </div>

          <div className={`${styles.col} ${styles.requisites}`}>
            <p className={styles.label}>{footer.requisitesTitle}</p>
            <p className={`${styles.text} ${styles.small}`}>
              {company.legalNameFull}
              <br />
              ИНН <Fill text={company.inn} /> · КПП <Fill text={company.kpp} />
              <br />
              ОГРН <Fill text={company.ogrn} />
              <br />
              Юридический адрес: <Fill text={company.address} />
            </p>
          </div>

          <div className={`${styles.col} ${styles.docs}`}>
            <p className={styles.label}>{footer.docsTitle}</p>
            <Link href="/privacy" className={styles.link}>
              Политика обработки персональных данных
            </Link>
            <Link href="/consent" className={styles.link}>
              Согласие на обработку персональных данных
            </Link>
            <CookieSettingsButton className={styles.linkButton}>{footer.cookieSettings}</CookieSettingsButton>
          </div>

          <div className={`${styles.col} ${styles.support}`}>
            <p className={styles.label}>{footer.supportTitle}</p>
            <div className={styles.supportRow}>
              <FsiLogo tone="dark" />
              <p className={styles.muted}>{fsiShort}</p>
            </div>
          </div>
        </div>

        <p className={styles.copy}>
          © {YEAR} {company.legalNameShort}
        </p>
      </footer>
    </div>
  );
}
