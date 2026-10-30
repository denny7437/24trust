import { problem } from '@/content/site';
import { SectionHead } from '../ui';
import styles from './Problem.module.css';

export function Problem() {
  return (
    <section id="problem" className="card reveal" aria-labelledby="problem-title">
      <SectionHead eyebrow={problem.eyebrow} title={problem.title} titleId="problem-title" lead={problem.lead} />

      <div className={styles.grid}>
        {problem.risks.map((risk, index) => (
          <article key={risk.title} className={`lift ${styles.risk}`}>
            <div className={styles.riskHead}>
              <h3 className={styles.riskTitle}>{risk.title}</h3>
              <span className={styles.riskNum} aria-hidden="true">
                {String(index + 1).padStart(2, '0')}
              </span>
            </div>
            <p className={styles.riskText}>{risk.text}</p>
          </article>
        ))}
      </div>

      <p className={styles.law}>
        <span className={styles.lawMark} aria-hidden="true">
          §
        </span>
        <span>{problem.law}</span>
      </p>
    </section>
  );
}
