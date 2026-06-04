import { useEffect, useRef } from 'react';

export function usarReveal<T extends HTMLElement = HTMLDivElement>() {
  const ref = useRef<T>(null);

  useEffect(() => {
    const el = ref.current;
    if (!el) return;

    const obs = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          el.classList.add('--visible');
          obs.disconnect();
        }
      },
      { threshold: 0.12 },
    );

    obs.observe(el);
    return () => obs.disconnect();
  }, []);

  return ref;
}
