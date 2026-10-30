import { audience } from '@/content/site';
import { Carousel } from '../Carousel';
import { Icon } from '../Icon';
import { SectionHead } from '../ui';
import styles from './Audience.module.css';

export function Audience() {
  return (
    <section id="audience" className="card reveal" aria-labelledby="audience-title">
      <SectionHead eyebrow={audience.eyebrow} title={audience.title} titleId="audience-title" />

      <Carousel count={audience.items.length} label="Отрасли, листайте" variant="audience">
        {audience.items.map((item) => (
          <article key={item.title} className={`lift lift-border ${styles.card}`}>
            <div className={styles.head}>
              <span className="ico ico-tint" aria-hidden="true">
                <Icon name={item.icon} />
              </span>
              <h3 className={styles.title}>{item.title}</h3>
            </div>
            <p className={styles.scenario}>{item.scenario}</p>
            <p className={styles.value}>{item.value}</p>
          </article>
        ))}
      </Carousel>
    </section>
  );
}
