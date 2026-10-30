import { security } from '@/content/site';
import { Icon } from '../Icon';
import { SectionHead } from '../ui';
import styles from './Security.module.css';

export function Security() {
  return (
    <section id="security" className="card card-dark reveal" aria-labelledby="security-title">
      <SectionHead eyebrow={security.eyebrow} title={security.title} titleId="security-title" lead={security.lead} />

      <div className={styles.contourRow}>
        <div className={styles.contour}>
          <span className={styles.contourLabel}>{security.contourLabel}</span>
          <ul className={styles.chips}>
            {security.contour.map((chip, index) => (
              <li key={chip} className={styles.chip}>
                {index === 0 ? <Icon name="shield" strokeWidth={2} /> : null}
                {chip}
              </li>
            ))}
          </ul>
        </div>
        <div className={styles.notes}>
          {security.notes.map((note) => (
            <p key={note.text} className={styles.noteLine}>
              <Icon name={note.icon} />
              {note.text}
            </p>
          ))}
        </div>
      </div>

      <div className={styles.items}>
        {security.items.map((item) => (
          <div key={item.title} className={`ico-host ${styles.item}`}>
            <span className="ico ico-dark" aria-hidden="true">
              <Icon name={item.icon} />
            </span>
            <div className={styles.itemBody}>
              <h3 className={styles.itemTitle}>{item.title}</h3>
              <p className={styles.itemText}>{item.text}</p>
            </div>
          </div>
        ))}
      </div>
    </section>
  );
}
