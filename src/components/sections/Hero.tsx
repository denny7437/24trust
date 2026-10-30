import { hero } from '@/content/site';
import { CtaLink } from '../CtaLink';
import { Icon } from '../Icon';
import { Verdict } from '../ui';
import styles from './Hero.module.css';

/** Объёмный щит с галочкой — иллюстрация первого экрана. */
function HeroShield() {
  return (
    <svg viewBox="0 0 300 330" className={`float ${styles.shieldSvg}`} aria-hidden="true" focusable="false">
      <defs>
        <linearGradient id="tg-hero-face" x1="0.2" y1="0" x2="0.8" y2="1">
          <stop offset="0" stopColor="#C9BDFF" />
          <stop offset="0.5" stopColor="#7B5CFF" />
          <stop offset="1" stopColor="#4425D6" />
        </linearGradient>
        <linearGradient id="tg-hero-side" x1="0" y1="0" x2="1" y2="1">
          <stop offset="0" stopColor="#3A1FB0" />
          <stop offset="1" stopColor="#1F1070" />
        </linearGradient>
        <linearGradient id="tg-hero-gloss" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0" stopColor="#FFFFFF" stopOpacity="0.85" />
          <stop offset="1" stopColor="#FFFFFF" stopOpacity="0" />
        </linearGradient>
        <radialGradient id="tg-hero-shadow" cx="0.5" cy="0.5" r="0.5">
          <stop offset="0" stopColor="#3A1FB0" stopOpacity="0.35" />
          <stop offset="1" stopColor="#3A1FB0" stopOpacity="0" />
        </radialGradient>
        <radialGradient id="tg-hero-orb" cx="0.35" cy="0.3" r="0.75">
          <stop offset="0" stopColor="#FFFFFF" />
          <stop offset="0.35" stopColor="#C9BDFF" />
          <stop offset="1" stopColor="#5A3BF0" />
        </radialGradient>
      </defs>
      <ellipse className={styles.shadow} cx="162" cy="308" rx="104" ry="14" fill="url(#tg-hero-shadow)" />
      <path d="M164 36 L258 72 V152 C258 216 218 264 164 288 C110 264 70 216 70 152 V72 Z" fill="url(#tg-hero-side)" />
      <path d="M152 24 L246 60 V140 C246 204 206 252 152 276 C98 252 58 204 58 140 V60 Z" fill="url(#tg-hero-face)" />
      <path
        d="M152 42 L230 72 V140 C230 194 197 234 152 256 C107 234 74 194 74 140 V72 Z"
        fill="none"
        stroke="#FFFFFF"
        strokeOpacity="0.35"
        strokeWidth="2"
      />
      <path d="M152 32 L238 65 V104 C190 94 120 106 66 136 V65 Z" fill="url(#tg-hero-gloss)" opacity="0.6" />
      <path
        d="M114 148 L142 176 L194 120"
        fill="none"
        stroke="#FFFFFF"
        strokeWidth="18"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      <circle className="bob-2" cx="266" cy="36" r="15" fill="url(#tg-hero-orb)" />
      <circle className={`bob-3 ${styles.orbLow}`} cx="34" cy="252" r="10" fill="url(#tg-hero-orb)" />
      <circle className={`bob-2 ${styles.orbSmall}`} cx="270" cy="232" r="7" fill="url(#tg-hero-orb)" />
    </svg>
  );
}

export function Hero() {
  return (
    <section id="top" className={`card ${styles.hero}`} aria-labelledby="hero-title">
      <p className={`anim-in ${styles.badge}`}>
        <Icon name="shield" strokeWidth={2.2} />
        {hero.badge}
      </p>

      <h1 id="hero-title" className={`anim-in delay-1 ${styles.title}`}>
        {hero.titleStart} <span className={styles.accent}>{hero.titleAccent}</span>
      </h1>

      <p className={`anim-in delay-2 ${styles.sub}`}>{hero.sub}</p>

      <div className={`anim-in delay-3 ${styles.actions}`}>
        <CtaLink className="btn btn-primary shine btn-mobile-block">{hero.primary}</CtaLink>
        <a href="#how" className="btn btn-ghost btn-mobile-block">
          {hero.secondary}
        </a>
      </div>

      <ul className={`anim-in delay-4 ${styles.facts}`}>
        {hero.facts.map((fact) => (
          <li key={fact} className={styles.fact}>
            <Icon name="check" strokeWidth={2.4} />
            {fact}
          </li>
        ))}
      </ul>

      <div className={`anim-in delay-5 ${styles.visual}`}>
        <div className={styles.shield}>
          <HeroShield />
        </div>
        <div className={`bob ${styles.dialogs}`} role="list" aria-label="Примеры вердиктов фильтра">
          {hero.dialog.map((item, index) => (
            <div key={item.text} role="listitem" className={`${styles.dialog} ${styles[`dialog${index + 1}`]}`}>
              <span className={styles.role}>{item.role}</span>
              <p className={styles.quote}>{item.text}</p>
              <Verdict kind={item.verdict} />
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
