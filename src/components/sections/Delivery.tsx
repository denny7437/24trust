import { delivery } from '@/content/site';
import { CtaLink } from '../CtaLink';
import { SectionHead } from '../ui';
import { DeliveryTabs } from './DeliveryTabs';
import styles from './Delivery.module.css';

export function Delivery() {
  return (
    <section id="delivery" className="card reveal" aria-labelledby="delivery-title">
      <SectionHead eyebrow={delivery.eyebrow} title={delivery.title} titleId="delivery-title" lead={delivery.lead} />

      {/* Таблица — от 768 px, на телефоне — переключатель вариантов */}
      <div className={styles.tableWrap}>
        <table className={styles.table}>
          <thead>
            <tr>
              <td className={styles.corner} />
              {delivery.options.map((option) => (
                <th key={option.id} scope="col" className={option.primary ? `${styles.colHead} ${styles.colHeadPrimary}` : styles.colHead}>
                  <span className={styles.colHeadInner}>
                    <span className={option.primary ? `${styles.badge} ${styles.badgePrimary}` : styles.badge}>{option.badge}</span>
                    <span className={styles.colName}>{option.name}</span>
                  </span>
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {delivery.rows.map((row) => (
              <tr key={row.label} className={styles.row}>
                <th scope="row" className={styles.rowHead}>
                  {row.label}
                </th>
                <td className={'emphasis' in row ? `${styles.cell} ${styles.cellPrimary} ${styles.cellStrong}` : `${styles.cell} ${styles.cellPrimary}`}>
                  {row.onprem}
                </td>
                <td className={styles.cell}>{row.plugin}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <DeliveryTabs />

      <div className={styles.footer}>
        <p className={styles.note}>{delivery.note}</p>
        <CtaLink className="btn btn-primary shine btn-mobile-block">{delivery.cta}</CtaLink>
      </div>
    </section>
  );
}
