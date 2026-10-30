import { faq } from '@/content/site';
import { CtaLink } from '../CtaLink';
import { Icon } from '../Icon';
import { CompanyEmail, Fill, SectionHead } from '../ui';
import { GOALS } from '@/lib/analytics';
import styles from './Faq.module.css';

export function Faq() {
  return (
    <section id="faq" className={`card reveal ${styles.faq}`} aria-labelledby="faq-title">
      <SectionHead eyebrow={faq.eyebrow} title={faq.title} titleId="faq-title" />

      <div className={styles.list}>
        {faq.items.map((item, index) => (
          <details key={item.q} className={styles.item} open={index === 0}>
            <summary className={styles.question}>
              <span>{item.q}</span>
              <span className={styles.plus} aria-hidden="true">
                <Icon name="plus" strokeWidth={2.2} />
              </span>
            </summary>
            <p className={styles.answer}>
              <Fill text={item.a} />
            </p>
          </details>
        ))}
      </div>

      <div className={styles.more}>
        <p className={styles.moreText}>
          {faq.more} <CompanyEmail />
        </p>
        <CtaLink topic="Другое" goal={GOALS.questionClick} className="btn btn-ghost btn-mobile-block">
          {faq.cta}
        </CtaLink>
      </div>
    </section>
  );
}
