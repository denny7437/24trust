'use client';

import { useEffect, useState } from 'react';

/** Какой блок страницы сейчас на уровне ~40 % высоты экрана. Для подсветки пункта навигации. */
export function useActiveSection(ids: readonly string[], heroId = 'top') {
  const [active, setActive] = useState<string | null>(null);

  useEffect(() => {
    const targets = [heroId, ...ids]
      .map((id) => document.getElementById(id))
      .filter((element): element is HTMLElement => element !== null);
    if (targets.length === 0) return;

    const observer = new IntersectionObserver(
      (entries) => {
        for (const entry of entries) {
          if (entry.isIntersecting) setActive(entry.target.id === heroId ? null : entry.target.id);
        }
      },
      { rootMargin: '-38% 0px -58% 0px' },
    );
    targets.forEach((target) => observer.observe(target));
    return () => observer.disconnect();
  }, [ids, heroId]);

  return active;
}
