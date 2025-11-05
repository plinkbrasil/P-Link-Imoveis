"use client";
import { useEffect, useState } from "react";

/**
 * Mostra o 3D somente se o repositório existir e tiver GitHub Pages habilitado.
 * - Evita HEAD/CORS em GitHub Pages.
 * - Se a API rate-limit ou falhar por rede, cai num fallback: mostra nada.
 */
export default function Async3DViewer({ url, code }: { url: string; code: string }) {
  const [ok, setOk] = useState(false);

  useEffect(() => {
    let active = true;

    async function check() {
      try {
        const repo = `P-Link_Imoveis_${code}`;
        const resp = await fetch(`https://api.github.com/repos/plinkbrasil/${repo}`);
        if (!active) return;

        if (resp.ok) {
          // A API pública retorna has_pages (true se GitHub Pages estiver ativo)
          const data = await resp.json();
          if (data && typeof data.has_pages === "boolean") {
            setOk(!!data.has_pages);
            return;
          }
          // Se não vier a flag (caso raro), assume que existe
          setOk(true);
          return;
        }

        // 404 repo não existe
        setOk(false);
      } catch {
        // Em falha de rede ou rate-limit, melhor não renderizar
        setOk(false);
      }
    }

    check();
    return () => {
      active = false;
    };
  }, [code]);

  if (!ok) return null;

  // Garante barra no final para GitHub Pages servir o index.html corretamente
  const src = url.endsWith("/") ? url : url + "/";

  return (
    <section className="space-y-2">
      <h2 className="text-lg font-semibold">Topografia em 3D</h2>
      <div className="rounded-xl overflow-hidden border">
        <iframe
          src={src}
          className="w-full"
          style={{ height: 480, border: "0" }}
          loading="lazy"
          referrerPolicy="no-referrer"
          allowFullScreen
        />
      </div>
    </section>
  );
}
