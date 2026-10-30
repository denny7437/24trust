'use client';

import { useRef, useState, type KeyboardEvent } from 'react';
import { delivery, type DeliveryOptionId } from '@/content/site';
import styles from './Delivery.module.css';

/** Варианты поставки на телефоне: переключатель и карточка выбранного варианта. */
export function DeliveryTabs() {
  const [active, setActive] = useState<DeliveryOptionId>('onprem');
  const tabRefs = useRef<Record<string, HTMLButtonElement | null>>({});
  const ids = delivery.options.map((option) => option.id);

  const onKeyDown = (event: KeyboardEvent<HTMLDivElement>) => {
    if (event.key !== 'ArrowRight' && event.key !== 'ArrowLeft' && event.key !== 'Home' && event.key !== 'End') return;
    event.preventDefault();
    const current = ids.indexOf(active);
    let next = current;
    if (event.key === 'ArrowRight') next = (current + 1) % ids.length;
    if (event.key === 'ArrowLeft') next = (current - 1 + ids.length) % ids.length;
    if (event.key === 'Home') next = 0;
    if (event.key === 'End') next = ids.length - 1;
    setActive(ids[next]);
    tabRefs.current[ids[next]]?.focus();
  };

  return (
    <div className={styles.tabs}>
      <div className={styles.tabList} role="tablist" aria-label="Вариант поставки" onKeyDown={onKeyDown}>
        {delivery.options.map((option) => {
          const selected = option.id === active;
          return (
            <button
              key={option.id}
              ref={(element) => {
                tabRefs.current[option.id] = element;
              }}
              type="button"
              role="tab"
              id={`delivery-tab-${option.id}`}
              aria-selected={selected}
              aria-controls={`delivery-panel-${option.id}`}
              tabIndex={selected ? 0 : -1}
              className={selected ? `${styles.tab} ${styles.tabActive}` : styles.tab}
              onClick={() => setActive(option.id)}
            >
              {option.name}
            </button>
          );
        })}
      </div>

      {delivery.options.map((option) => (
        <div
          key={option.id}
          id={`delivery-panel-${option.id}`}
          role="tabpanel"
          aria-labelledby={`delivery-tab-${option.id}`}
          hidden={option.id !== active}
          className={option.primary ? `${styles.panel} ${styles.panelPrimary}` : styles.panel}
        >
          <div className={styles.panelHead}>
            <span className={option.primary ? `${styles.badge} ${styles.badgePrimary}` : styles.badge}>{option.badge}</span>
            <h3 className={styles.panelTitle}>{option.name}</h3>
          </div>
          <dl className={styles.facts}>
            {delivery.rows.map((row) => (
              <div key={row.label} className={styles.fact}>
                <dt className={styles.factLabel}>{row.label}</dt>
                <dd className={'emphasis' in row && option.primary ? `${styles.factValue} ${styles.cellStrong}` : styles.factValue}>
                  {row[option.id]}
                </dd>
              </div>
            ))}
          </dl>
        </div>
      ))}
    </div>
  );
}
