'use client';

import { useEffect, useRef, useState, type ReactNode } from 'react';
import styles from './Carousel.module.css';

type CarouselProps = {
  /** Число карточек — для точек-индикаторов. */
  count: number;
  /** Подпись для скринридера, например «Отрасли, листайте». */
  label: string;
  /** verdicts — три вердикта, audience — карточки отраслей. */
  variant: 'verdicts' | 'audience';
  children: ReactNode;
};

/**
 * На телефоне — горизонтальная лента со snap-прокруткой и точками.
 * От 640 px — обычная сетка, точки скрыты.
 */
export function Carousel({ count, label, variant, children }: CarouselProps) {
  const trackRef = useRef<HTMLDivElement>(null);
  const [index, setIndex] = useState(0);

  useEffect(() => {
    const track = trackRef.current;
    if (!track) return;
    const items = Array.from(track.children) as HTMLElement[];
    const observer = new IntersectionObserver(
      (entries) => {
        for (const entry of entries) {
          if (entry.isIntersecting) setIndex(items.indexOf(entry.target as HTMLElement));
        }
      },
      { root: track, threshold: 0.6 },
    );
    items.forEach((item) => observer.observe(item));
    return () => observer.disconnect();
  }, [count]);

  const goTo = (target: number) => {
    const track = trackRef.current;
    const item = track?.children[target] as HTMLElement | undefined;
    if (!track || !item) return;
    const padding = parseFloat(getComputedStyle(track).scrollPaddingLeft) || 0;
    track.scrollTo({ left: item.offsetLeft - padding, behavior: 'smooth' });
  };

  return (
    <div className={styles.root}>
      <div ref={trackRef} className={`${styles.track} ${styles[variant]}`} role="region" aria-label={label} tabIndex={0}>
        {children}
      </div>
      <div className={styles.dots}>
        {Array.from({ length: count }, (_, dot) => (
          <button
            key={dot}
            type="button"
            className={dot === index ? `${styles.dot} ${styles.dotActive}` : styles.dot}
            aria-label={`Карточка ${dot + 1} из ${count}`}
            aria-current={dot === index ? 'true' : undefined}
            onClick={() => goTo(dot)}
          />
        ))}
      </div>
    </div>
  );
}
