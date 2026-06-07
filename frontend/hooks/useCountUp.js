'use client';

import { useEffect, useState } from 'react';

export function useCountUp(target, duration = 2000, triggered = false) {
  const [count, setCount] = useState(0);

  useEffect(() => {
    if (!triggered) return undefined;
    let startTime;
    const animate = (ts) => {
      if (!startTime) startTime = ts;
      const progress = Math.min((ts - startTime) / duration, 1);
      const eased = 1 - (1 - progress) ** 3;
      setCount(Math.round(eased * target));
      if (progress < 1) requestAnimationFrame(animate);
    };
    const frame = requestAnimationFrame(animate);
    return () => cancelAnimationFrame(frame);
  }, [target, duration, triggered]);

  return count;
}
