import type { CSSProperties } from 'react';
import { LeadForm } from './LeadForm';
import styles from './LeadForm.module.css';

/** Обёртка формы. id="form" — якорь для всех кнопок «Обсудить пилот». */
export function FormPanel({ style }: { style?: CSSProperties }) {
  return (
    <section id="form" className={`form-panel ${styles.panel}`} aria-labelledby="form-title" style={style}>
      <LeadForm />
    </section>
  );
}
