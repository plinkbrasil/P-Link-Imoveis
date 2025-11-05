// -*- app/components/Gallery.tsx -*-
'use client';
import { useEffect, useMemo, useState } from 'react';
type Props = { images: string[]; alt?: string };
export default function Gallery({ images, alt }: Props) {
  const pics = useMemo(() => (images || []).filter(Boolean), [images]);
  const [idx, setIdx] = useState(0);
  useEffect(() => setIdx(0), [pics.length]);
  const prev = () => setIdx((v) => (v - 1 + pics.length) % pics.length);
  const next = () => setIdx((v) => (v + 1) % pics.length);
  useEffect(() => {
    function onKey(e: KeyboardEvent) {
      if (pics.length <= 1) return;
      if (e.key === 'ArrowRight') next();
      if (e.key === 'ArrowLeft') prev();
    }
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [pics, idx]);
  if (!pics.length) return null;
  return (
    <div className="space-y-3">
      <div className="relative">
        <div className="aspect-video bg-zinc-100 rounded-xl overflow-hidden">
          <img src={pics[idx]} alt={alt || 'Imagem do imóvel'} className="w-full h-full object-cover" />
        </div>
        {pics.length > 1 && (<>
          <button type="button" aria-label="Imagem anterior" onClick={prev}
            className="absolute left-2 top-1/2 -translate-y-1/2 rounded-full border border-brand-200 bg-white/90 hover:bg-white shadow px-3 py-2 text-sm text-brand-900">‹</button>
          <button type="button" aria-label="Próxima imagem" onClick={next}
            className="absolute right-2 top-1/2 -translate-y-1/2 rounded-full border border-brand-200 bg-white/90 hover:bg-white shadow px-3 py-2 text-sm text-brand-900">›</button>
        </>)}
      </div>
      {pics.length > 1 && (
        <div className="grid grid-cols-5 gap-2">
          {pics.map((src, i) => (
            <button key={src + i} type="button" onClick={() => setIdx(i)}
              className={"relative rounded-lg overflow-hidden border " + (i === idx ? "ring-2 ring-brand-600" : "")}>
              <div className="aspect-video bg-zinc-100">
                <img src={src} alt={(alt || 'Imagem do imóvel') + ' miniatura'} className="w-full h-full object-cover" />
              </div>
            </button>
          ))}
        </div>
      )}
    </div>
  );
}
