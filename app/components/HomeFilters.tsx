"use client";

import { useRouter, useSearchParams } from "next/navigation";
import { useState, useEffect } from "react";

export default function HomeFilters() {
  const router = useRouter();
  const sp = useSearchParams();

  // estados iniciais vindos da URL
  const [uf, setUf] = useState(sp.get("uf") || "");
  const [minArea, setMinArea] = useState(sp.get("minArea") || "");
  const [maxArea, setMaxArea] = useState(sp.get("maxArea") || "");
  const [minPreco, setMinPreco] = useState(sp.get("minPreco") || "");
  const [maxPreco, setMaxPreco] = useState(sp.get("maxPreco") || "");

  // quando a URL muda (ex.: voltar no histórico), sincroniza os inputs
  useEffect(() => {
    setUf(sp.get("uf") || "");
    setMinArea(sp.get("minArea") || "");
    setMaxArea(sp.get("maxArea") || "");
    setMinPreco(sp.get("minPreco") || "");
    setMaxPreco(sp.get("maxPreco") || "");
  }, [sp]);

  function submit(e: React.FormEvent) {
    e.preventDefault();
    const params = new URLSearchParams();
    if (uf) params.set("uf", uf.toUpperCase());
    if (minArea) params.set("minArea", minArea);
    if (maxArea) params.set("maxArea", maxArea);
    if (minPreco) params.set("minPreco", minPreco);
    if (maxPreco) params.set("maxPreco", maxPreco);
    router.push(`/?${params.toString()}`);
  }

  function limpar() {
    setUf(""); setMinArea(""); setMaxArea(""); setMinPreco(""); setMaxPreco("");
    router.push(`/`);
  }

  return (
    <form onSubmit={submit} className="rounded-xl border bg-white/90 backdrop-blur p-3 md:p-4 shadow-sm">
      <div className="grid grid-cols-2 md:grid-cols-6 gap-3">
        <div className="col-span-2 md:col-span-1">
          <label className="block text-xs text-zinc-600 mb-1">UF</label>
          <input
            value={uf}
            onChange={(e) => setUf(e.target.value.toUpperCase())}
            maxLength={2}
            placeholder="PR"
            className="w-full rounded-lg border px-2 py-2 text-sm uppercase"
          />
        </div>

        <div>
          <label className="block text-xs text-zinc-600 mb-1">Mín m²</label>
          <input
            value={minArea}
            onChange={(e) => setMinArea(e.target.value)}
            inputMode="numeric"
            className="w-full rounded-lg border px-2 py-2 text-sm"
            placeholder="5000"
          />
        </div>
        <div>
          <label className="block text-xs text-zinc-600 mb-1">Máx m²</label>
          <input
            value={maxArea}
            onChange={(e) => setMaxArea(e.target.value)}
            inputMode="numeric"
            className="w-full rounded-lg border px-2 py-2 text-sm"
            placeholder="20000"
          />
        </div>
        <div>
          <label className="block text-xs text-zinc-600 mb-1">Preço mín</label>
          <input
            value={minPreco}
            onChange={(e) => setMinPreco(e.target.value)}
            inputMode="numeric"
            className="w-full rounded-lg border px-2 py-2 text-sm"
            placeholder="100000"
          />
        </div>
        <div>
          <label className="block text-xs text-zinc-600 mb-1">Preço máx</label>
          <input
            value={maxPreco}
            onChange={(e) => setMaxPreco(e.target.value)}
            inputMode="numeric"
            className="w-full rounded-lg border px-2 py-2 text-sm"
            placeholder="500000"
          />
        </div>

        <div className="col-span-2 md:col-span-1 flex items-end gap-2">
          <button type="submit" className="flex-1 rounded-lg bg-[#0a454f] text-white px-3 py-2 text-sm font-semibold">
            Filtrar
          </button>
          <button type="button" onClick={limpar} className="rounded-lg border px-3 py-2 text-sm">
            Limpar
          </button>
        </div>
      </div>
    </form>
  );
}
