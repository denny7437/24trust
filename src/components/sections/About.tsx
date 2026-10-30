import { about, company } from '@/content/site';
import { Fill, SectionHead } from '../ui';
import styles from './About.module.css';

/** Логотип ФСИ: официальный файл из /public, пока его нет — плашка-заглушка. */
export function FsiLogo({ tone = 'light' }: { tone?: 'light' | 'dark' }) {
  const className = [styles.fsi, tone === 'dark' && styles.fsiDark, company.fsiLogo && styles.fsiHasLogo]
    .filter(Boolean)
    .join(' ');
  return (
    <a href={company.fsiUrl} className={className} target="_blank" rel="noopener noreferrer">
      {company.fsiLogo ? (
        // Официальный файл логотипа — без изменения пропорций и цвета
        // eslint-disable-next-line @next/next/no-img-element
        <img src={company.fsiLogo} alt="Фонд содействия инновациям" className={styles.fsiImg} />
      ) : (
        <span>{tone === 'dark' ? '[Логотип ФСИ]' : '[Логотип Фонда содействия инновациям]'}</span>
      )}
    </a>
  );
}

export function About() {
  return (
    <section id="about" className={`card reveal ${styles.about}`} aria-labelledby="about-title">
      <SectionHead eyebrow={about.eyebrow} title={about.title} titleId="about-title" lead={about.text} />
      {about.team ? <p className={styles.team}>{about.team}</p> : null}

      <div className={styles.support}>
        <FsiLogo />
        <p className={styles.supportText}>
          <Fill text={about.support} />
        </p>
      </div>
    </section>
  );
}
