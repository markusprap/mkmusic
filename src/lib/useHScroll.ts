import { useCallback, useEffect, useState } from 'react';

// State-based ref callback (not a plain useRef) — the elements this scrolls
// are often conditionally rendered (skeleton -> real content), and a plain
// ref set once in useEffect misses that transition. Setting state via the
// ref callback itself re-triggers measurement on attach.
export function useHScroll<T extends HTMLElement>() {
  const [el, setEl] = useState<T | null>(null);
  const [canPrev, setCanPrev] = useState(false);
  const [canNext, setCanNext] = useState(false);

  const update = useCallback(() => {
    if (!el) return;
    setCanPrev(el.scrollLeft > 4);
    setCanNext(el.scrollLeft < el.scrollWidth - el.clientWidth - 4);
  }, [el]);

  useEffect(() => {
    if (!el) return;
    update();
    el.addEventListener('scroll', update);
    window.addEventListener('resize', update);
    return () => { el.removeEventListener('scroll', update); window.removeEventListener('resize', update); };
  }, [el, update]);

  return {
    ref: setEl, canPrev, canNext,
    scrollPrev: () => el?.scrollBy({ left: -el.clientWidth * 0.85, behavior: 'smooth' }),
    scrollNext: () => el?.scrollBy({ left: el.clientWidth * 0.85, behavior: 'smooth' }),
  };
}
