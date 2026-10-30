import { solution } from '@/content/site';
import { Carousel } from '../Carousel';
import { Icon, QuoteMark } from '../Icon';
import { SectionHead, Verdict } from '../ui';
import styles from './Solution.module.css';

export function Solution() {
  return (
    <section id="solution" className="card reveal" aria-labelledby="solution-title">
      <SectionHead eyebrow={solution.eyebrow} title={solution.title} titleId="solution-title" lead={solution.lead} />

      <Carousel count={solution.verdicts.length} label="Три вердикта, листайте" variant="verdicts">
        {solution.verdicts.map((item) => (
          <article key={item.kind} className={`lift lift-border ${styles.verdictCard}`}>
            <Verdict kind={item.kind} />
            <p className={styles.verdictText}>{item.text}</p>
            <div className={styles.when}>
              <span className={styles.whenLabel}>Когда</span>
              <p className={styles.whenText}>{item.when}</p>
            </div>
          </article>
        ))}
      </Carousel>

      <div className={styles.props}>
        {solution.properties.map((item) => (
          <div key={item.title} className={`tile lift ${styles.prop}`}>
            <span className="ico" aria-hidden="true">
              <Icon name={item.icon} />
            </span>
            <div className={styles.propBody}>
              <h3 className={styles.propTitle}>{item.title}</h3>
              <p className={styles.propText}>{item.text}</p>
            </div>
          </div>
        ))}
        <div className={`lift ${styles.quote}`}>
          <QuoteMark className={styles.quoteMark} />
          <p className={styles.quoteText}>{solution.quote}</p>
        </div>
      </div>
    </section>
  );
}
