import type { ReactNode } from 'react';
import { company, isPlaceholder, phoneHref, telegramHandle, verdictLabels, type VerdictKind } from '@/content/site';
import { Icon } from './Icon';

/** Подсвечивает заглушки вида [заполнить] внутри строки. Пустое значение тоже заглушка, иначе в тексте остаётся незаметная дыра. */
export function Fill({ text }: { text: string }) {
  const parts = (text.trim() ? text : '[не заполнено]').split(/(\[[^\]]+\])/g).filter(Boolean);
  return (
    <>
      {parts.map((part, index) =>
        part.startsWith('[') && part.endsWith(']') ? (
          <mark key={index} className="todo">
            {part}
          </mark>
        ) : (
          part
        ),
      )}
    </>
  );
}

/** E-mail компании: ссылка, когда адрес заполнен, и подсвеченная заглушка — пока нет (в том числе пустое значение). */
export function CompanyEmail({ className }: { className?: string }) {
  if (!company.email.trim() || isPlaceholder(company.email)) return <Fill text={company.email} />;
  return (
    <a className={className} href={`mailto:${company.email}`}>
      {company.email}
    </a>
  );
}

/** Телефон: ссылка tel:, когда номер распознан. */
export function CompanyPhone({ className }: { className?: string }) {
  const href = phoneHref(company.phone);
  if (!href) return <Fill text={company.phone} />;
  return (
    <a className={className} href={href}>
      {company.phone}
    </a>
  );
}

/** Telegram: ссылка на t.me, когда указан ник. */
export function CompanyTelegram({ className }: { className?: string }) {
  const handle = telegramHandle(company.telegram);
  if (!handle) return <Fill text={company.telegram} />;
  return (
    <a className={className} href={`https://t.me/${handle}`} target="_blank" rel="noopener noreferrer">
      @{handle}
    </a>
  );
}

export function Verdict({ kind }: { kind: VerdictKind }) {
  return (
    <span className={`verdict verdict-${kind}`}>
      <Icon name={kind} strokeWidth={2} />
      {verdictLabels[kind]}
    </span>
  );
}

type SectionHeadProps = {
  eyebrow: string;
  title: string;
  titleId: string;
  lead?: ReactNode;
  children?: ReactNode;
};

export function SectionHead({ eyebrow, title, titleId, lead, children }: SectionHeadProps) {
  return (
    <div className="section-head">
      {children}
      <p className="eyebrow">{eyebrow}</p>
      <h2 className="h2" id={titleId}>
        {title}
      </h2>
      {lead ? <p className="lead">{lead}</p> : null}
    </div>
  );
}
