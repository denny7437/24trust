import styles from './Logo.module.css';

type LogoProps = {
  /** Плашка «AI» справа от слова. Без неё логотип короче — для шапки на телефоне. */
  withTag?: boolean;
  tone?: 'light' | 'dark';
  className?: string;
};

/**
 * Логотип A «Щит в букве U»: широкий гротеск в духе PLATA, буква U — щит акцентного цвета.
 * Цвет букв — currentColor, щит — var(--accent) на светлом и #9C86FF на тёмном.
 */
export function Logo({ withTag = true, tone = 'light', className }: LogoProps) {
  return (
    <svg
      viewBox={withTag ? '0 0 543 40' : '0 0 489 40'}
      className={[styles.logo, className].filter(Boolean).join(' ')}
      aria-hidden="true"
      focusable="false"
    >
      <g fill="none" stroke="currentColor" strokeWidth="6">
        <path d="M0 3H40M20 3V40" />
        <path d="M54 0V40M54 3H76A10 10 0 0 1 76 23H54" />
        <path d="M103 0V21A16 16 0 0 0 135 21V0" />
        <path d="M184 9C184 5.5 180.5 3 175 3H161C155.5 3 152 6 152 11.5C152 17 155.5 20 161 20H175C180.5 20 184 23 184 28.5C184 34 180.5 37 175 37H161C155.5 37 152 34.5 152 31" />
        <path d="M198 3H238M218 3V40" />
        <path d="M286 11C286 6 281.5 3 276 3H262C256 3 252 7.5 252 14V26C252 32.5 256 37 262 37H276C281.5 37 286 33 286 27V21H271" />
        <path d="M352 40V17C352 8.5 358.5 3 369 3C379.5 3 386 8.5 386 17V40M352 25H386" />
        <path d="M403 0V40M403 3H425A10 10 0 0 1 425 23H403" />
        <path d="M452 0V40M452 3H471C480.5 3 486 9.5 486 20C486 30.5 480.5 37 471 37H452" />
        {withTag ? (
          <>
            <rect x="504" y="1" width="38" height="22" rx="6" strokeWidth="2" />
            <path d="M3 40V17C3 8.5 9.5 3 20 3C30.5 3 37 8.5 37 17V40M3 25H37" transform="translate(512.2 4) scale(0.4)" />
            <path d="M3 0V40" transform="translate(531.4 4) scale(0.4)" />
          </>
        ) : null}
      </g>
      <g fill="currentColor">
        <polygon points="70,20 76.5,20 89,40 82.5,40" />
        <polygon points="419,20 425.5,20 438,40 431.5,40" />
      </g>
      <path
        className={tone === 'dark' ? `${styles.shield} ${styles.shieldDark}` : styles.shield}
        d="M303 0V16C303 26 310 32.5 319 37C328 32.5 335 26 335 16V0"
        fill="none"
        strokeWidth="6"
        strokeLinejoin="round"
      />
    </svg>
  );
}
