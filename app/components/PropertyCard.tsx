// ==== Helpers de leitura/formatação ====
function coerceNumAny(x: any): number | undefined {
  if (typeof x === "number" && Number.isFinite(x)) return x;
  if (typeof x === "string") {
    const n = Number(x.trim().replace(/\./g, "").replace(",", ".").replace(/[^0-9.\-]/g, ""));
    return Number.isFinite(n) ? n : undefined;
  }
  return undefined;
}
function readPrice(p: any): number | undefined {
  for (const k of ["preco", "price", "valor"]) {
    const n = coerceNumAny(p?.[k]);
    if (n !== undefined) return n;
  }
  return undefined;
}
function readArea(p: any): number | undefined {
  for (const k of ["area_m2", "area", "metragem", "tamanho", "m2"]) {
    const n = coerceNumAny(p?.[k]);
    if (n !== undefined) return n;
  }
  return undefined;
}
function fmtBRL(n?: number | null): string | null {
  if (n === undefined || n === null) return null;
  if (n === -1) return "VENDIDO";
  if (n === 0) return "SOB CONSULTA";
  try { return n.toLocaleString("pt-BR", { style: "currency", currency: "BRL" }); }
  catch { return String(n); }
}

// ==== Card do imóvel (Home) ====
import Link from "next/link";

function PropertyCard({ p }: { p: any }) {
  const areaNum = readArea(p);
  const areaStr = typeof areaNum === "number" ? `${areaNum.toLocaleString("pt-BR")} m²` : null;

  const precoNum = readPrice(p);
  const precoStr = fmtBRL(precoNum);

  const compNum  = coerceNumAny(p?.valor_comparativo);
  const compStr  = compNum && compNum > 0 ? fmtBRL(compNum) : null;
  const hasDiscount = typeof precoNum === "number" && typeof compNum === "number" && compNum > precoNum;

  return (
    <Link
      href={`/imoveis/${p.slug || p.id}`}
      className="rounded-xl border overflow-hidden hover:shadow transition bg-white"
    >
      <div className="relative aspect-video bg-zinc-100">
        {p.fotos?.[0] && (
          <img
            src={p.fotos[0]}
            alt={p.titulo || p.id}
            className="w-full h-full object-cover"
          />
        )}
        {hasDiscount && (
          <span className="absolute top-2 left-2 bg-rose-600 text-white text-xs px-2 py-1 rounded">
            PREÇO BAIXOU
          </span>
        )}
      </div>


      

      <div className="p-3 space-y-1.5">
        {/* ID */}
        <div className="text-[11px] uppercase tracking-wider text-zinc-500">Cód: {p.id}</div>

        {/* Título */}
        <div className="text-base md:text-lg font-semibold leading-snug">
        {p.titulo || "Imóvel"}
        </div>

        {/* Localização */}
        {p.endereco && (
          <div className="text-xs text-zinc-600">{p.endereco}</div>
        )}

        {/* Metragem */}
        {areaStr && (
          <div className="text-xs text-zinc-600">{areaStr}</div>
        )}

        {/* Preço (com comparativo riscado quando for desconto) */}
        {(compStr && hasDiscount) && (
          <div className="text-xs text-zinc-400 line-through">{compStr}</div>
        )}
        {precoStr && (
  <div
    className={`price-text ${
      precoStr === "VENDIDO"
        ? "price-sold"
        : precoStr === "SOB CONSULTA"
        ? "price-muted"
        : "price-ok"
    }`}
  >
    {precoStr}
  </div>

)}
      </div>
    </Link>
  );
}

