// -*- app/components/HeaderSearch.tsx -*-
'use client';

import { useEffect, useMemo, useRef, useState } from 'react';

type Item = {
  id: string;
  slug?: string;
  titulo: string;
  endereco?: string;
  area_m2?: number | string;
  preco?: number | string;
  moeda?: string;
};

function normalize(s: string) {
  return s.normalize('NFD').replace(/\p{Diacritic}/gu, '').toLowerCase();
}
function coerceNumAny(x: unknown): number | undefined {
  if (typeof x === 'number' && Number.isFinite(x)) return x;
  if (typeof x === 'string') {
    const n = Number(x.trim().replace(/\./g, '').replace(',', '.').replace(/[^0-9.\-]/g, ''));
    return Number.isFinite(n) ? Math.round(n) : undefined;
  }
  return undefined;
}
function parseNumber(raw: string): number | null {
  const digits = raw.replace(/[^0-9]/g, '');
  if (!digits) return null;
  try { return parseInt(digits, 10); } catch { return null; }
}
function isCode(raw: string) {
  return /^[a-z]{1,3}\d{2,}$/i.test(raw.trim());
}

/** score por similaridade relativa (0..1), usando diff/max */
function similarityScore(a: number, b: number) {
  const maxv = Math.max(a, b);
  if (maxv <= 0) return 0;
  const diff = Math.abs(a - b);
  return 1 - Math.min(diff / maxv, 1);
}

export default function HeaderSearch({ items }: { items: Item[] }) {
  const [open, setOpen] = useState(false);
  const [q, setQ] = useState('');
  const wrapRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    function onDoc(e: MouseEvent) {
      if (!wrapRef.current) return;
      if (!wrapRef.current.contains(e.target as Node)) setOpen(false);
    }
    function onKey(e: KeyboardEvent) { if (e.key === 'Escape') setOpen(false); }
    document.addEventListener('mousedown', onDoc);
    document.addEventListener('keydown', onKey);
    return () => { document.removeEventListener('mousedown', onDoc); document.removeEventListener('keydown', onKey); };
  }, []);

  useEffect(() => { if (open) setTimeout(() => inputRef.current?.focus(), 0); else setQ(''); }, [open]);

  const results = useMemo(() => {
    const raw = q.trim();
    if (!raw) return [] as Item[];

    const low = raw.toLowerCase();
    const normRaw = normalize(raw);

    // 1) Código (ex.: TR046, CS005…)
    if (isCode(raw)) {
      const cand = items
        .filter((it) => it.id.toLowerCase().includes(low))
        .sort((a, b) => a.id.localeCompare(b.id));
      return cand.slice(0, 8);
    }

    // Parse numérico
    const num = parseNumber(raw);

    // Flags de intenção explícita
    const looksArea = /(?:\bm\b|\bm2\b|m²)/i.test(raw); // aceita "m", "m2" ou "m²"
    const looksMoney = /(^|\s)(r\$|\$)/i.test(raw);

    // Helpers que retornam {it, score}
    const byArea = (target: number) =>
      items
        .map((it) => ({ it, a: coerceNumAny(it.area_m2) }))
        .filter((x) => typeof x.a === 'number')
        .map((x) => ({ it: x.it, score: similarityScore(x.a as number, target) }))
        .filter((x) => x.score > 0.2)
        .sort((a, b) => b.score - a.score)
        .slice(0, 16); // margem maior para depois mesclar

    const byPrice = (target: number) =>
      items
        .map((it) => ({ it, p: coerceNumAny(it.preco) }))
        .filter((x) => typeof x.p === 'number')
        .map((x) => ({ it: x.it, score: similarityScore(x.p as number, target) }))
        .filter((x) => x.score > 0.2)
        .sort((a, b) => b.score - a.score)
        .slice(0, 16);

    // 2) Se tem indicação clara de área → usa área
    if (num && looksArea) {
      return byArea(num).slice(0, 8).map(x => x.it);
    }

    // 3) Se tem indicação clara de dinheiro → usa preço
    if (num && looksMoney) {
      return byPrice(num).slice(0, 8).map(x => x.it);
    }

    // 4) Se é apenas número → tentar como ÁREA e como PREÇO, unir e ordenar
    if (num && !looksArea && !looksMoney) {
      const areaRes = byArea(num);
      const priceRes = byPrice(num);

      // Merge por id com score máximo
      const merged = new Map<string, { it: Item; score: number }>();
      for (const r of [...areaRes, ...priceRes]) {
        const prev = merged.get(r.it.id);
        if (!prev || r.score > prev.score) merged.set(r.it.id, r);
      }
      return Array.from(merged.values())
        .sort((a, b) => b.score - a.score)
        .slice(0, 8)
        .map(x => x.it);
    }

    // 5) Texto (título/endereço)
    const t = normalize(raw);
    const scored = items.map((it) => {
      const hay = normalize([it.titulo, it.endereco].filter(Boolean).join(' '));
      const idx = hay.indexOf(t);
      const score = idx >= 0 ? 1 - idx / Math.max(hay.length, 1) : 0;
      return { it, score };
    }).filter(x => x.score > 0);
    scored.sort((a, b) => b.score - a.score);
    return scored.slice(0, 8).map(s => s.it);
  }, [q, items]);

  function goto(it: Item) {
    const href = `/imoveis/${it.slug || it.id}`;
    window.location.href = href;
  }

  function pricePiece(it: Item): string {
    const n = coerceNumAny(it.preco);
    if (typeof n !== 'number') return '';
    if (n === 0) return 'SOB CONSULTA';
    if ((it.moeda || 'BRL') === 'BRL') {
      try { return n.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' }); } catch {}
    }
    return String(n);
  }

  function areaPiece(it: Item): string {
    const a = coerceNumAny(it.area_m2);
    return typeof a === 'number' ? `${a.toLocaleString('pt-BR')} m²` : '';
  }

  return (
    <div className="relative" ref={wrapRef}>
      <button
        type="button"
        aria-label="Buscar"
        title="Buscar"
        onClick={() => setOpen((v) => !v)}
        className="p-2 rounded-full border border-white/30 text-white hover:bg-white/10"
      >
        <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" className="w-5 h-5 fill-none stroke-current">
          <circle cx="11" cy="11" r="7" strokeWidth="2"></circle>
          <line x1="21" y1="21" x2="16.65" y2="16.65" strokeWidth="2"></line>
        </svg>
      </button>

      {open && (
        <div className="absolute right-0 top-full mt-2 w-80 rounded-xl border border-brand-200 bg-white shadow p-2">
          <input
            ref={inputRef}
            value={q}
            onChange={(e) => setQ(e.target.value)}
            placeholder="Pesquisar por código, preço, m², título..."
            className="w-full rounded-lg border px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-brand-600"
          />
          {q && (
            <div className="mt-2 max-h-72 overflow-auto divide-y">
              {results.length === 0 ? (
                <div className="p-2 text-sm text-zinc-500">Nada encontrado</div>
              ) : results.map((r) => {
                  const pieces = [areaPiece(r), pricePiece(r)].filter(Boolean).join(' • ');
                  return (
                    <button
                      key={r.id}
                      type="button"
                      onClick={() => goto(r)}
                      className="w-full text-left p-2 hover:bg-zinc-50"
                    >
                      <div className="text-[11px] uppercase tracking-wider text-zinc-500">{r.id}</div>
                      <div className="text-sm font-medium">{r.titulo}</div>
                      {r.endereco ? <div className="text-xs text-zinc-500">{r.endereco}</div> : null}
                      {pieces ? <div className="text-xs text-zinc-500">{pieces}</div> : null}
                    </button>
                  );
                })}
            </div>
          )}
        </div>
      )}
    </div>
  );
}
