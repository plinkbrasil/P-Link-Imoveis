"use client";

import { useEffect, useMemo, useRef, useState } from "react";

type Props = {
  images: string[];
  title?: string;
};

export default function PhotoGallery({ images, title }: Props) {
  const validImages = useMemo(
    () => (Array.isArray(images) ? images.filter(Boolean) : []),
    [images]
  );
  const [idx, setIdx] = useState(0);
  const [open, setOpen] = useState(false);

  // ----- Thumbs scroll refs -----
  const thumbsRef = useRef<HTMLDivElement | null>(null);
  function scrollThumbs(dir: "prev" | "next") {
    const el = thumbsRef.current;
    if (!el) return;
    const delta = Math.round(el.clientWidth * 0.9);
    el.scrollBy({ left: dir === "next" ? delta : -delta, behavior: "smooth" });
  }

  function select(i: number) {
    setIdx(i);
    // centra a miniatura ativa
    const el = thumbsRef.current;
    if (!el) return;
    const thumb = el.querySelector<HTMLButtonElement>(`[data-idx="${i}"]`);
    if (!thumb) return;
    const rThumb = thumb.getBoundingClientRect();
    const rWrap = el.getBoundingClientRect();
    const overL = rThumb.left - rWrap.left;
    const overR = rThumb.right - rWrap.right;
    if (overL < 0) el.scrollBy({ left: overL, behavior: "smooth" });
    if (overR > 0) el.scrollBy({ left: overR, behavior: "smooth" });
  }

  if (!validImages.length) return null;

  return (
    <div className="space-y-3">
      {/* Imagem principal */}
      <div
        className="relative overflow-hidden rounded-xl border bg-zinc-100"
        aria-label={title || "Galeria de fotos"}
      >
        <img
          src={validImages[idx]}
          alt={title || `Foto ${idx + 1}`}
          className="w-full h-auto object-cover cursor-zoom-in"
          onClick={() => setOpen(true)}
        />

        {/* Botões de navegação (desktop) */}
        {validImages.length > 1 && (
          <>
            <button
              type="button"
              onClick={() => select(Math.max(0, idx - 1))}
              aria-label="Anterior"
              className="hidden md:flex absolute left-2 top-1/2 -translate-y-1/2 items-center justify-center w-9 h-9 rounded-full bg-white/80 hover:bg-white shadow"
            >
              ‹
            </button>
            <button
              type="button"
              onClick={() => select(Math.min(validImages.length - 1, idx + 1))}
              aria-label="Próxima"
              className="hidden md:flex absolute right-2 top-1/2 -translate-y-1/2 items-center justify-center w-9 h-9 rounded-full bg-white/80 hover:bg-white shadow"
            >
              ›
            </button>
          </>
        )}
      </div>

      {/* Thumbs em carrossel */}
      {validImages.length > 1 && (
        <div className="relative">
          <div className="flex gap-2">
            <button
              type="button"
              onClick={() => scrollThumbs("prev")}
              aria-label="Rolagem para a esquerda"
              className="hidden sm:inline-flex shrink-0 items-center justify-center w-9 h-9 rounded-full border bg-white hover:bg-zinc-50"
            >
              ←
            </button>

            <div
              ref={thumbsRef}
              className="flex-1 overflow-x-auto hide-scrollbar snap-x snap-mandatory"
            >
              <div className="flex gap-2 pr-2">
                {validImages.map((src, i) => (
                  <button
                    key={src + i}
                    data-idx={i}
                    type="button"
                    onClick={() => select(i)}
                    className={`snap-start shrink-0 rounded-lg overflow-hidden border ${i === idx ? "ring-2 ring-emerald-600" : ""}`}
                    style={{ width: 120, height: 80 }}
                  >
                    <img
                      src={src}
                      alt={`Miniatura ${i + 1}`}
                      className="w-full h-full object-cover"
                      loading="lazy"
                    />
                  </button>
                ))}
              </div>
            </div>

            <button
              type="button"
              onClick={() => scrollThumbs("next")}
              aria-label="Rolagem para a direita"
              className="hidden sm:inline-flex shrink-0 items-center justify-center w-9 h-9 rounded-full border bg-white hover:bg-zinc-50"
            >
              →
            </button>
          </div>
        </div>
      )}

      {/* Lightbox */}
      {open && (
        <Lightbox
          images={validImages}
          startIndex={idx}
          onClose={() => setOpen(false)}
          onIndexChange={(i) => setIdx(i)}
          title={title}
        />
      )}
    </div>
  );
}

/* ===================== LIGHTBOX ===================== */

function Lightbox({
  images,
  startIndex = 0,
  onClose,
  onIndexChange,
  title,
}: {
  images: string[];
  startIndex?: number;
  onClose: () => void;
  onIndexChange: (i: number) => void;
  title?: string;
}) {
  const [i, setI] = useState(startIndex);
  const [scale, setScale] = useState(1);
  const [offset, setOffset] = useState({ x: 0, y: 0 });
  const wrapRef = useRef<HTMLDivElement | null>(null);
  const imgRef = useRef<HTMLImageElement | null>(null);

  // Atualiza índice para a galeria pai
  useEffect(() => onIndexChange(i), [i, onIndexChange]);

  // Fechar com ESC / navegar com setas
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
      if (e.key === "ArrowRight") next();
      if (e.key === "ArrowLeft") prev();
    };
    document.addEventListener("keydown", onKey);
    return () => document.removeEventListener("keydown", onKey);
  }, []);

  function prev() {
    setI((v) => Math.max(0, v - 1));
    resetView();
  }
  function next() {
    setI((v) => Math.min(images.length - 1, v + 1));
    resetView();
  }
  function resetView() {
    setScale(1);
    setOffset({ x: 0, y: 0 });
  }

  // Duplo clique / toque: alterna zoom 1x ↔ 2x
  function toggleZoom(e?: React.MouseEvent) {
    e?.preventDefault();
    setScale((s) => (s > 1 ? 1 : 2));
    setOffset({ x: 0, y: 0 });
  }

  // Pan ao arrastar quando com zoom
  const drag = useDrag(({ dx, dy }) => {
    if (scale <= 1) return;
    setOffset((o) => ({ x: o.x + dx, y: o.y + dy }));
  });

  // Swipe para navegar quando sem zoom
  const swipe = useSwipe({
    onSwipeLeft: () => next(),
    onSwipeRight: () => prev(),
  });

  // Wheel para zoom (desktop)
  function onWheel(e: React.WheelEvent) {
    e.preventDefault();
    const delta = -e.deltaY; // para cima aumenta
    setScale((s) => {
      const next = clamp(s + (delta > 0 ? 0.1 : -0.1), 1, 3);
      if (next === 1) setOffset({ x: 0, y: 0 });
      return next;
    });
  }

  return (
    <div
      ref={wrapRef}
      className="fixed inset-0 z-[100] bg-black/90 backdrop-blur-sm flex flex-col"
      role="dialog"
      aria-label={title || "Visualização de imagem"}
      {...swipe.handlers}
    >
      {/* Topbar */}
      <div className="flex items-center justify-between p-3 text-white">
        <div className="text-sm opacity-80">
          {i + 1} / {images.length}
        </div>
        <div className="flex items-center gap-2">
          <button
            onClick={toggleZoom}
            className="px-3 py-1.5 rounded-lg bg-white/10 hover:bg-white/20"
          >
            {scale > 1 ? "Ajustar" : "Zoom"}
          </button>
          <button
            onClick={onClose}
            className="px-3 py-1.5 rounded-lg bg-white/10 hover:bg-white/20"
            aria-label="Fechar"
          >
            Fechar
          </button>
        </div>
      </div>

      {/* Área da imagem */}
      <div
        className="relative flex-1 flex items-center justify-center overflow-hidden touch-pan-y"
        onWheel={onWheel}
        {...(scale > 1 ? drag.handlers : {})}
        onDoubleClick={toggleZoom}
      >
        {/* Botões prev/next */}
        {i > 0 && (
          <button
            onClick={prev}
            className="hidden md:flex absolute left-3 top-1/2 -translate-y-1/2 w-10 h-10 items-center justify-center rounded-full bg-white/20 hover:bg-white/30 text-white"
            aria-label="Anterior"
          >
            ‹
          </button>
        )}
        {i < images.length - 1 && (
          <button
            onClick={next}
            className="hidden md:flex absolute right-3 top-1/2 -translate-y-1/2 w-10 h-10 items-center justify-center rounded-full bg-white/20 hover:bg-white/30 text-white"
            aria-label="Próxima"
          >
            ›
          </button>
        )}

        <img
          ref={imgRef}
          src={images[i]}
          alt={title || `Imagem ${i + 1}`}
          className="max-h-full max-w-full select-none"
          style={{
            transform: `translate(${offset.x}px, ${offset.y}px) scale(${scale})`,
            transition: "transform 0.05s linear",
            cursor: scale > 1 ? "grab" : "zoom-in",
          }}
          draggable={false}
        />
      </div>

      {/* Thumbs também no lightbox (opcional) */}
      {images.length > 1 && (
        <div className="p-3">
          <div className="flex gap-2 overflow-x-auto">
            {images.map((src, ti) => (
              <button
                key={src + ti}
                onClick={() => {
                  setI(ti);
                  resetView();
                }}
                className={`shrink-0 rounded-md overflow-hidden border ${ti === i ? "ring-2 ring-emerald-500" : ""}`}
                style={{ width: 80, height: 56 }}
              >
                <img src={src} alt={`Miniatura ${ti + 1}`} className="w-full h-full object-cover" />
              </button>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}

/* ============ hooks utilitários (sem dependências) ============ */

function clamp(n: number, min: number, max: number) {
  return Math.max(min, Math.min(max, n));
}

function useDrag(cb: (p: { dx: number; dy: number }) => void) {
  const last = useRef<{ x: number; y: number } | null>(null);
  const onPointerDown = (e: React.PointerEvent) => {
    (e.target as HTMLElement).setPointerCapture?.(e.pointerId);
    last.current = { x: e.clientX, y: e.clientY };
  };
  const onPointerMove = (e: React.PointerEvent) => {
    if (!last.current) return;
    cb({ dx: e.clientX - last.current.x, dy: e.clientY - last.current.y });
    last.current = { x: e.clientX, y: e.clientY };
  };
  const onPointerUp = () => {
    last.current = null;
  };
  return {
    handlers: {
      onPointerDown,
      onPointerMove,
      onPointerUp,
    },
  };
}

function useSwipe({
  onSwipeLeft,
  onSwipeRight,
  threshold = 40,
}: {
  onSwipeLeft?: () => void;
  onSwipeRight?: () => void;
  threshold?: number;
}) {
  const startX = useRef<number | null>(null);
  const onTouchStart = (e: React.TouchEvent) => {
    startX.current = e.touches[0]?.clientX ?? null;
  };
  const onTouchEnd = (e: React.TouchEvent) => {
    if (startX.current == null) return;
    const endX = e.changedTouches[0]?.clientX ?? startX.current;
    const delta = endX - startX.current;
    if (delta <= -threshold) onSwipeLeft?.();
    if (delta >= threshold) onSwipeRight?.();
    startX.current = null;
  };
  return {
    handlers: {
      onTouchStart,
      onTouchEnd,
    },
  };
}
