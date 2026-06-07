'use client';

import { useCountUp } from '../../../hooks/useCountUp';
import { cn } from '@/lib/utils';

export function CountUpNumber({ target, duration = 2000, triggered, flash, suffix = '' }) {
  const count = useCountUp(target, duration, triggered);
  return (
    <span
      className={cn(
        'text-4xl font-semibold tracking-tight transition-colors duration-300 sm:text-5xl',
        flash ? 'text-brand' : 'text-foreground',
      )}
    >
      {count.toLocaleString()}
      {suffix}
    </span>
  );
}
