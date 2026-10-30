import type { ReactNode } from 'react';

/** Линейные иконки 24×24, цвет — currentColor. */
const paths = {
  shield: <path d="M12 3l7 3v5.5c0 4.3-2.9 7.9-7 9.5-4.1-1.6-7-5.2-7-9.5V6l7-3z" />,
  shieldCheck: (
    <>
      <path d="M12 3l7 3v5.5c0 4.3-2.9 7.9-7 9.5-4.1-1.6-7-5.2-7-9.5V6l7-3z" />
      <path d="M9 12l2 2 4-4" />
    </>
  ),
  check: <path d="M5 12.5l4.2 4.2L19 7" />,
  pass: (
    <>
      <circle cx="12" cy="12" r="8.5" />
      <path d="M8.3 12.3l2.5 2.5 4.9-5.1" />
    </>
  ),
  rewrite: (
    <>
      <path d="M4.5 19.5h4l10-10-4-4-10 10v4z" />
      <path d="M12.5 7.5l4 4" />
    </>
  ),
  block: (
    <>
      <circle cx="12" cy="12" r="8.5" />
      <path d="M6.3 6.3l11.4 11.4" />
    </>
  ),
  slash: (
    <>
      <circle cx="12" cy="12" r="8.5" />
      <path d="M6.3 6.3l11.4 11.4" />
    </>
  ),
  inOut: (
    <>
      <path d="M4 8h12M12 4l4 4-4 4" />
      <path d="M20 16H8M12 12l-4 4 4 4" />
    </>
  ),
  matrix: (
    <>
      <rect x="4" y="4" width="16" height="16" rx="2" />
      <path d="M4 9.5h16M4 14.5h16M9.5 4v16M14.5 4v16" />
    </>
  ),
  norm: (
    <>
      <path d="M7 3.5h7l4 4V20a.5.5 0 0 1-.5.5h-10A.5.5 0 0 1 6.5 20V4a.5.5 0 0 1 .5-.5z" />
      <path d="M14 3.5V8h4M9.5 12h5M9.5 15.5h5" />
    </>
  ),
  sliders: (
    <>
      <path d="M4 6h10M18 6h2M4 12h3M11 12h9M4 18h12" />
      <circle cx="16" cy="6" r="2" />
      <circle cx="9" cy="12" r="2" />
      <circle cx="18" cy="18" r="2" />
    </>
  ),
  eye: (
    <>
      <path d="M2.5 12s3.5-6.5 9.5-6.5 9.5 6.5 9.5 6.5-3.5 6.5-9.5 6.5S2.5 12 2.5 12z" />
      <circle cx="12" cy="12" r="2.8" />
    </>
  ),
  log: (
    <>
      <rect x="5" y="3.5" width="14" height="17" rx="2" />
      <path d="M8.5 8h7M8.5 12h7M8.5 16h4" />
    </>
  ),
  user: (
    <>
      <circle cx="12" cy="8" r="3.5" />
      <path d="M5 20c1.2-3.6 4-5.5 7-5.5s5.8 1.9 7 5.5" />
    </>
  ),
  chip: (
    <>
      <rect x="6" y="6" width="12" height="12" rx="2" />
      <path d="M9.5 9.5h5v5h-5z" />
      <path d="M9 3v3M15 3v3M9 18v3M15 18v3M3 9h3M3 15h3M18 9h3M18 15h3" />
    </>
  ),
  lock: (
    <>
      <rect x="5" y="10.5" width="14" height="10" rx="2" />
      <path d="M8 10.5V8a4 4 0 0 1 8 0v2.5" />
    </>
  ),
  hash: <path d="M9.5 4l-2 16M16.5 4l-2 16M4.5 9h16M3.5 15h16" />,
  bars: <path d="M5 20v-7M10 20V5M15 20v-9M20 20v-5" />,
  license: (
    <>
      <path d="M7 3.5h10a1 1 0 0 1 1 1v16H6v-16a1 1 0 0 1 1-1z" />
      <path d="M9 12l2 2 4-4" />
    </>
  ),
  arrowIn: (
    <>
      <path d="M3 12h11M10 8l4 4-4 4" />
      <path d="M14 4h5a1 1 0 0 1 1 1v14a1 1 0 0 1-1 1h-5" />
    </>
  ),
  bank: (
    <>
      <path d="M3.5 9.5L12 4l8.5 5.5" />
      <path d="M5.5 10.5v7M10 10.5v7M14 10.5v7M18.5 10.5v7M3.5 20h17" />
    </>
  ),
  antenna: (
    <>
      <path d="M12 11v10" />
      <circle cx="12" cy="9" r="2" />
      <path d="M7.8 13.2a6 6 0 0 1 0-8.4M16.2 4.8a6 6 0 0 1 0 8.4" />
    </>
  ),
  bag: (
    <>
      <path d="M5 8h14l-1 12.5H6L5 8z" />
      <path d="M9 8V6.5a3 3 0 0 1 6 0V8" />
    </>
  ),
  gov: (
    <>
      <path d="M3.5 11h17L12 5.5 3.5 11z" />
      <path d="M6 11v7M10 11v7M14 11v7M18 11v7M4 20.5h16" />
    </>
  ),
  book: (
    <>
      <path d="M3.5 5.5c3-1 6-1 8.5 1 2.5-2 5.5-2 8.5-1V19c-3-1-6-1-8.5 1-2.5-2-5.5-2-8.5-1V5.5z" />
      <path d="M12 6.5V20" />
    </>
  ),
  code: <path d="M8.5 7L3.5 12l5 5M15.5 7l5 5-5 5M13.5 5l-3 14" />,
  menu: <path d="M4 7h16M4 12h16M4 17h16" />,
  close: <path d="M6 6l12 12M18 6L6 18" />,
  plus: <path d="M5 12h14M12 5v14" />,
  arrowDown: <path d="M12 5v14M6 13l6 6 6-6" />,
  arrowLeft: <path d="M19 12H5M11 6l-6 6 6 6" />,
  alert: (
    <>
      <circle cx="12" cy="12" r="8.5" />
      <path d="M12 7.5v5.5M12 16.2v.3" />
    </>
  ),
  chevronDown: <path d="M6 9l6 6 6-6" />,
} satisfies Record<string, ReactNode>;

export type IconName = keyof typeof paths;

type IconProps = {
  name: IconName;
  strokeWidth?: number;
  className?: string;
  size?: number;
};

export function Icon({ name, strokeWidth = 1.8, className, size }: IconProps) {
  return (
    <svg
      viewBox="0 0 24 24"
      width={size}
      height={size}
      fill="none"
      stroke="currentColor"
      strokeWidth={strokeWidth}
      strokeLinecap="round"
      strokeLinejoin="round"
      className={className}
      aria-hidden="true"
      focusable="false"
    >
      {paths[name]}
    </svg>
  );
}

/** Кавычки для плитки с цитатой. */
export function QuoteMark({ className }: { className?: string }) {
  return (
    <svg viewBox="0 0 34 26" width="34" height="26" fill="none" className={className} aria-hidden="true" focusable="false">
      <path
        d="M2 26V15C2 7 6 2.5 13 1l1.5 3.5C10.5 6 8.5 9 8.5 13H14v13H2zm18 0V15c0-8 4-12.5 11-14l1.5 3.5C28.5 6 26.5 9 26.5 13H32v13H20z"
        fill="#FFFFFF"
        fillOpacity="0.5"
      />
    </svg>
  );
}
