'use client';

import type { MouseEvent, ReactNode } from 'react';
import { GOALS, reachGoal } from '@/lib/analytics';
import { requestForm } from '@/lib/events';
import type { Topic } from '@/lib/validation';

type CtaLinkProps = {
  children: ReactNode;
  className?: string;
  /** Тема, которую кнопка заранее выбирает в форме. */
  topic?: Topic;
  /** Цель Метрики. */
  goal?: string;
  onNavigate?: () => void;
};

function isInViewport(element: HTMLElement) {
  const rect = element.getBoundingClientRect();
  return rect.top >= 0 && rect.bottom <= window.innerHeight + 1 && rect.height > 0;
}

/**
 * Кнопка, ведущая к форме заявки. На широком экране форма закреплена справа и уже видна —
 * тогда страница не прокручивается, а форма подсвечивается и получает фокус.
 */
export function CtaLink({ children, className, topic = 'Пилот', goal = GOALS.pilotClick, onNavigate }: CtaLinkProps) {
  const handleClick = (event: MouseEvent<HTMLAnchorElement>) => {
    const panel = document.getElementById('form');
    if (panel && isInViewport(panel)) event.preventDefault();
    requestForm(topic);
    reachGoal(goal);
    onNavigate?.();
  };

  return (
    <a href="#form" className={className} onClick={handleClick}>
      {children}
    </a>
  );
}
