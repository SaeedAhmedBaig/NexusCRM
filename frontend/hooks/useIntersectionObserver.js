'use client';

import { useEffect, useRef, useState } from 'react';

export function useIntersectionObserver(options = { threshold: 0.3 }) {
  const ref = useRef(null);
  const [isVisible, setIsVisible] = useState(false);
  const { root = null, rootMargin, threshold = 0.3 } = options;

  useEffect(() => {
    const node = ref.current;
    if (!node) return undefined;

    const observer = new IntersectionObserver(([entry]) => {
      if (entry.isIntersecting) setIsVisible(true);
    }, { root, rootMargin, threshold });

    observer.observe(node);
    return () => observer.disconnect();
  }, [root, rootMargin, threshold]);

  return { ref, isVisible };
}
