// -*- app/components/HomeBannerClient.tsx -*-
'use client';

import { useEffect, useState } from 'react';

/**
 * Fixed background banner at the top of the page.
 * - Full width (100vw), proportional height (no cropping)
 * - Implemented as a fixed DIV with CSS background-image (stable on scroll)
 * - Adds a spacer of the same height so the rest of the content begins below it
 */
export default function HomeBannerClient({ src }: { src: string }) {
  const [height, setHeight] = useState<number>(() => {
    if (typeof window === 'undefined') return 0;
    return Math.round(window.innerHeight * 0.6); // safe fallback
  });

  useEffect(() => {
    let mounted = true;
    function recompute() {
      const img = new Image();
      img.onload = () => {
        if (!mounted) return;
        const ratio = (img.naturalHeight || 1) / (img.naturalWidth || 1);
        // compute proportional height by viewport width, but clamp to 45–90vh
        const ideal = window.innerWidth * ratio;
        const h = Math.round(Math.max(window.innerHeight * 0.45, Math.min(window.innerHeight * 0.9, ideal)));
        setHeight(h);
      };
      img.src = src;
    }
    recompute();
    const onResize = () => recompute();
    window.addEventListener('resize', onResize);
    return () => { mounted = false; window.removeEventListener('resize', onResize); };
  }, [src]);

  return (
    <>
      {/* Spacer to push the page content below the fixed banner */}
      <div style={{ height }} />
      {/* Fixed background banner (stays at top while page scrolls) */}
      <div
        className="-z-10 fixed left-0 top-0 w-screen pointer-events-none select-none"
        style={{
          height,
          backgroundImage: `url(${src})`,
          backgroundSize: 'cover',
          backgroundPosition: 'center center',
          backgroundRepeat: 'no-repeat',
        }}
        aria-hidden="true"
      />
    </>
  );
}
