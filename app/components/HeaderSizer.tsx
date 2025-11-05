// -*- app/components/HeaderSizer.tsx -*-
'use client';

import { useEffect } from 'react';

/**
 * Observa a altura do <header> e escreve em --header-h (px).
 * Assim conseguimos fazer seções de altura: calc(100vh - var(--header-h))
 */
export default function HeaderSizer() {
  useEffect(() => {
    function update() {
      const el = document.querySelector('header');
      const h = el ? Math.round((el as HTMLElement).getBoundingClientRect().height) : 64;
      document.documentElement.style.setProperty('--header-h', h + 'px');
      // forçar reflow de componentes que dependem de tamanho
      window.dispatchEvent(new Event('pl-header-resize'));
    }
    update();

    const el = document.querySelector('header');
    const ro = new ResizeObserver(() => update());
    if (el) ro.observe(el);

    window.addEventListener('resize', update);
    return () => {
      window.removeEventListener('resize', update);
      ro.disconnect();
    };
  }, []);
  return null;
}
