'use client';

import Link from 'next/link';
import { useEffect, useRef, useState, type FormEvent, type ReactNode } from 'react';
import { form as copy } from '@/content/site';
import { GOALS, reachGoal } from '@/lib/analytics';
import { FORM_REQUEST_EVENT, type FormRequestDetail } from '@/lib/events';
import {
  AI_PLACES,
  FIELD_ORDER,
  LIMITS,
  TOPICS,
  emptyLead,
  validateField,
  validateLead,
  type LeadErrors,
  type LeadField,
  type LeadValues,
  type Topic,
} from '@/lib/validation';
import { Icon } from './Icon';
import { CompanyEmail } from './ui';
import styles from './LeadForm.module.css';

type Status = 'idle' | 'sending' | 'success' | 'error' | 'rate';

const OPTIONAL_FIELDS: LeadField[] = ['contact', 'aiPlace', 'comment'];

function withoutEmpty(errors: LeadErrors): LeadErrors {
  const clean: LeadErrors = {};
  for (const field of FIELD_ORDER) {
    if (errors[field]) clean[field] = errors[field];
  }
  return clean;
}

/** Поле формы по имени: отдельные ref на каждое поле не нужны. */
function fieldElement(form: HTMLFormElement | null, field: LeadField) {
  const element = form?.elements.namedItem(field);
  return element instanceof HTMLElement ? element : null;
}

function Field({ id, label, error, children }: { id: string; label: string; error?: string; children: ReactNode }) {
  return (
    <div className={styles.field}>
      <label htmlFor={id} className={styles.label}>
        {label}
      </label>
      {children}
      {error ? (
        <p id={`${id}-error`} className={styles.error}>
          <Icon name="alert" strokeWidth={2} />
          {error}
        </p>
      ) : null}
    </div>
  );
}

/** Форма заявки на пилот. Одна на странице: на широком экране закреплена справа, на узком — после блока «Пилот». */
export function LeadForm() {
  const [values, setValues] = useState<LeadValues>(() => emptyLead());
  const [errors, setErrors] = useState<LeadErrors>({});
  const [submitted, setSubmitted] = useState(false);
  const [status, setStatus] = useState<Status>('idle');
  const [honeypot, setHoneypot] = useState('');
  const detailsRef = useRef<HTMLDetailsElement>(null);
  const successRef = useRef<HTMLParagraphElement>(null);
  const formRef = useRef<HTMLFormElement>(null);

  // Кнопки «Обсудить пилот» и «Задать вопрос» выбирают тему и подсвечивают форму.
  useEffect(() => {
    const onRequest = (event: Event) => {
      const { topic } = (event as CustomEvent<FormRequestDetail>).detail;
      setValues((prev) => ({ ...prev, topic }));
      const panel = document.getElementById('form');
      if (panel) {
        panel.classList.remove(styles.highlight);
        panel.getBoundingClientRect(); // перезапуск анимации подсветки
        panel.classList.add(styles.highlight);
      }
      if (window.matchMedia('(min-width: 1280px)').matches) {
        fieldElement(formRef.current, 'name')?.focus({ preventScroll: true });
      }
    };
    window.addEventListener(FORM_REQUEST_EVENT, onRequest);
    return () => window.removeEventListener(FORM_REQUEST_EVENT, onRequest);
  }, []);

  useEffect(() => {
    if (status === 'success') successRef.current?.focus();
  }, [status]);

  const focusField = (field: LeadField) => {
    if (OPTIONAL_FIELDS.includes(field) && detailsRef.current) detailsRef.current.open = true;
    window.requestAnimationFrame(() => fieldElement(formRef.current, field)?.focus());
  };

  const update = <K extends LeadField>(field: K, value: LeadValues[K]) => {
    const next = { ...values, [field]: value };
    setValues(next);
    if (submitted) setErrors((prev) => withoutEmpty({ ...prev, [field]: validateField(field, next) }));
  };

  const describe = (field: LeadField) => ({
    id: `lead-${field}`,
    'aria-invalid': errors[field] ? true : undefined,
    'aria-describedby': errors[field] ? `lead-${field}-error` : undefined,
  });

  const onSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (status === 'sending') return;
    setSubmitted(true);

    const found = validateLead(values);
    setErrors(found);
    const firstInvalid = FIELD_ORDER.find((field) => found[field]);
    if (firstInvalid) {
      focusField(firstInvalid);
      return;
    }

    setStatus('sending');
    try {
      const response = await fetch('/api/lead', {
        method: 'POST',
        headers: { 'content-type': 'application/json' },
        body: JSON.stringify({ ...values, website: honeypot, page: window.location.href }),
      });
      if (response.ok) {
        setStatus('success');
        reachGoal(GOALS.leadSubmit);
        return;
      }
      if (response.status === 429) {
        setStatus('rate');
        return;
      }
      if (response.status === 400) {
        const data = (await response.json().catch(() => null)) as { errors?: LeadErrors } | null;
        const serverErrors = withoutEmpty(data?.errors ?? {});
        const first = FIELD_ORDER.find((field) => serverErrors[field]);
        if (first) {
          setErrors(serverErrors);
          setStatus('idle');
          focusField(first);
          return;
        }
      }
      setStatus('error');
    } catch {
      setStatus('error');
    }
  };

  const reset = () => {
    setValues(emptyLead(values.topic as Topic));
    setErrors({});
    setSubmitted(false);
    setStatus('idle');
  };

  return (
    <div className={styles.root}>
      <div className={styles.head}>
        <h2 className={styles.title} id="form-title">
          {copy.title}
        </h2>
        <p className={styles.sub}>{copy.sub}</p>
      </div>

      {status === 'success' ? (
        <div className={styles.success} role="status">
          <span className={styles.successIcon} aria-hidden="true">
            <Icon name="check" strokeWidth={2.4} />
          </span>
          <p ref={successRef} tabIndex={-1} className={styles.successText}>
            {copy.success}
          </p>
          <button type="button" className="btn btn-ghost btn-sm" onClick={reset}>
            {copy.again}
          </button>
        </div>
      ) : (
        <form ref={formRef} className={styles.form} onSubmit={onSubmit} noValidate aria-labelledby="form-title">
          <div className={styles.mainFields}>
            <Field id="lead-name" label="Имя" error={errors.name}>
              <input
                {...describe('name')}
                className={styles.input}
                type="text"
                name="name"
                autoComplete="name"
                placeholder="Как к вам обращаться"
                maxLength={LIMITS.name}
                value={values.name}
                onChange={(event) => update('name', event.target.value)}
              />
            </Field>
            <Field id="lead-company" label="Компания" error={errors.company}>
              <input
                {...describe('company')}
                className={styles.input}
                type="text"
                name="company"
                autoComplete="organization"
                placeholder="Название компании"
                maxLength={LIMITS.company}
                value={values.company}
                onChange={(event) => update('company', event.target.value)}
              />
            </Field>
            <Field id="lead-email" label="Рабочий e-mail" error={errors.email}>
              <input
                {...describe('email')}
                className={styles.input}
                type="email"
                name="email"
                autoComplete="email"
                inputMode="email"
                placeholder="name@company.ru"
                maxLength={LIMITS.email}
                value={values.email}
                onChange={(event) => update('email', event.target.value)}
              />
            </Field>
            <Field id="lead-topic" label="Тема" error={errors.topic}>
              <select
                {...describe('topic')}
                className={`${styles.input} ${styles.select}`}
                name="topic"
                value={values.topic}
                onChange={(event) => update('topic', event.target.value)}
              >
                {TOPICS.map((topic) => (
                  <option key={topic} value={topic}>
                    {topic}
                  </option>
                ))}
              </select>
            </Field>
          </div>

          <details className={styles.details} ref={detailsRef}>
            <summary className={styles.summary}>
              <span className={styles.summaryText}>
                {copy.optionalSummary}
                <span className={styles.summaryHint}>{copy.optionalHint}</span>
              </span>
              <Icon name="chevronDown" strokeWidth={2} className={styles.chevron} />
            </summary>
            <div className={styles.detailsBody}>
              <Field id="lead-contact" label="Телефон или Telegram" error={errors.contact}>
                <input
                  {...describe('contact')}
                  className={styles.input}
                  type="text"
                  name="contact"
                  autoComplete="tel"
                  placeholder="+7… или @username"
                  maxLength={LIMITS.contact}
                  value={values.contact}
                  onChange={(event) => update('contact', event.target.value)}
                />
              </Field>
              <Field id="lead-aiPlace" label="Где работает ваш ИИ" error={errors.aiPlace}>
                <select
                  {...describe('aiPlace')}
                  className={`${styles.input} ${styles.select}`}
                  name="aiPlace"
                  value={values.aiPlace}
                  onChange={(event) => update('aiPlace', event.target.value)}
                >
                  <option value="">Выберите вариант</option>
                  {AI_PLACES.map((place) => (
                    <option key={place} value={place}>
                      {place}
                    </option>
                  ))}
                </select>
              </Field>
              <Field id="lead-comment" label="Комментарий" error={errors.comment}>
                <textarea
                  {...describe('comment')}
                  className={`${styles.input} ${styles.textarea}`}
                  name="comment"
                  rows={3}
                  maxLength={LIMITS.comment}
                  placeholder="Расскажите о задаче"
                  value={values.comment}
                  onChange={(event) => update('comment', event.target.value)}
                />
                <span className={styles.counter}>
                  {values.comment.length} / {LIMITS.comment}
                </span>
              </Field>
            </div>
          </details>

          {/* Поле-ловушка для ботов: людям не видно, при заполнении заявка не сохраняется */}
          <div className={styles.trap} aria-hidden="true">
            <label htmlFor="lead-website">Сайт</label>
            <input
              id="lead-website"
              type="text"
              name="website"
              tabIndex={-1}
              autoComplete="off"
              value={honeypot}
              onChange={(event) => setHoneypot(event.target.value)}
            />
          </div>

          <div className={styles.consentBlock}>
            <label className={styles.consent} htmlFor="lead-consent">
              <input
                {...describe('consent')}
                className={styles.checkbox}
                type="checkbox"
                name="consent"
                checked={values.consent}
                onChange={(event) => update('consent', event.target.checked)}
              />
              <span>
                {copy.consentStart}{' '}
                <Link href="/consent" target="_blank" rel="noopener">
                  {copy.consentLink}
                </Link>
              </span>
            </label>
            {errors.consent ? (
              <p id="lead-consent-error" className={styles.error}>
                <Icon name="alert" strokeWidth={2} />
                {errors.consent}
              </p>
            ) : null}
          </div>

          <button type="submit" className="btn btn-primary btn-block shine" disabled={status === 'sending'}>
            {status === 'sending' ? copy.sending : copy.submit}
          </button>

          {status === 'error' || status === 'rate' ? (
            <p className={styles.alert} role="alert">
              <Icon name="alert" strokeWidth={2} />
              <span>
                {status === 'rate' ? copy.rateLimited : copy.failure} <CompanyEmail />
              </span>
            </p>
          ) : null}

          <p className={styles.note}>
            {copy.privacyNote}{' '}
            <Link href="/privacy" target="_blank" rel="noopener">
              {copy.privacyLink}
            </Link>
          </p>
        </form>
      )}
    </div>
  );
}
