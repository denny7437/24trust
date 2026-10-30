import { pilot, pilotBadge } from '@/content/site';
import { CtaLink } from '../CtaLink';
import { Fill } from '../ui';
import styles from './Pilot.module.css';

export function Pilot() {
  return (
    <section id="pilot" className={`card reveal ${styles.pilot}`} aria-labelledby="pilot-title">
      <div className={styles.top}>
        <div className={styles.intro}>
          <p className={styles.badge}>
            <span className="live-dot" aria-hidden="true" />
            {pilotBadge}
          </p>
          <p className="eyebrow">{pilot.eyebrow}</p>
        </div>
        <h2 id="pilot-title" className={`h2 ${styles.title}`}>
          {pilot.title}
        </h2>
        <p className={`lead ${styles.lead}`}>{pilot.lead}</p>
        <div className={styles.orbs} aria-hidden="true">
          <span className={`bob ${styles.orb} ${styles.orbBig}`} />
          <span className={`bob-2 ${styles.orb} ${styles.orbMid}`} />
          <span className={`bob-3 ${styles.orb} ${styles.orbSmall}`} />
        </div>
      </div>

      <ol className={styles.steps}>
        {pilot.steps.map((step, index) => {
          const last = index === pilot.steps.length - 1;
          return (
            <li key={step.title} className={styles.step}>
              <div className={styles.rail}>
                <span className={last ? `${styles.num} ${styles.numLast}` : styles.num} aria-hidden="true">
                  {index + 1}
                </span>
                {last ? null : <span className={styles.line} aria-hidden="true" />}
              </div>
              <div className={last ? `${styles.body} ${styles.bodyLast}` : styles.body}>
                <h3 className={styles.stepTitle}>{step.title}</h3>
                <p className={styles.stepText}>{step.text}</p>
              </div>
            </li>
          );
        })}
      </ol>

      <div className={styles.terms}>
        <p className={styles.termsText}>
          <b>{pilot.termsLabel}</b> <Fill text={pilot.terms} />
        </p>
        <CtaLink className="btn btn-primary shine btn-mobile-block">{pilot.cta}</CtaLink>
      </div>
    </section>
  );
}
