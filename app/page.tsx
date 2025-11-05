// app/page.tsx
import Link from "next/link";
import { listProperties } from "@/lib/properties";
import HomeFilters from "@/app/components/HomeFilters";
import { normalizeLatLng } from "@/lib/geo";
import EmptyState from "@/app/components/EmptyState";

/* ===== Helpers ===== */
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
  if (n === 0) return "SOB CONSULTA";
  if (n === -1) return "VENDIDO";
  try { return n.toLocaleString("pt-BR", { style: "currency", currency: "BRL" }); }
  catch { return String(n); }
}

/** Quebra "Bairro, Cidade, UF" em partes */
function parseAddress(endereco: any): { bairro?: string; cidade?: string; uf?: string } {
  const s = typeof endereco === "string" ? endereco : "";
  const parts = s.split(",").map((p) => p.trim()).filter(Boolean);
  if (parts.length === 3) return { bairro: parts[0], cidade: parts[1], uf: parts[2] };
  if (parts.length === 2) return { cidade: parts[0], uf: parts[1] };
  if (parts.length === 1) return { cidade: parts[0] };
  return {};
}

/** Normaliza o tipo para testar variações */
function normTipoHome(p: any): string {
  const raw = String(p?.tipo || p?.titulo || "Imóvel").toLowerCase();
  return raw.normalize("NFD").replace(/[\u0300-\u036f]/g, "");
}

/** Título contextual (mesma lógica da página do imóvel) */
function buildTitleHome(p: any): string {
  const tipoNorm = normTipoHome(p);
  const areaNum = readArea(p);
  const metragem = typeof areaNum === "number" ? `${areaNum.toLocaleString("pt-BR")} m²` : "";

  const { bairro, cidade, uf } = parseAddress(p?.endereco);
  const local =
    bairro && cidade && uf
      ? `${bairro} | ${cidade}/${uf}`
      : cidade && uf
      ? `${cidade}/${uf}`
      : (p?.endereco || "P-Link Imóveis");

  let prefixo = "Imóvel à Venda";
  if (/(terreno|lote|area)/.test(tipoNorm)) {
    prefixo = "Terreno à Venda";
  } else if (/(galp|industrial|logistic|condominio logistico)/.test(tipoNorm)) {
    prefixo = "Galpão Industrial à Venda";
  } else if (/(casa|sobrado)/.test(tipoNorm)) {
    prefixo = "Casa à Venda";
  } else if (/(apart|studio|kitnet|cobertura)/.test(tipoNorm)) {
    prefixo = "Apartamento à Venda";
  } else if (/(hotel|pousada|flat)/.test(tipoNorm)) {
    prefixo = "Hotel à Venda";
  }

  return [prefixo, metragem, local].filter(Boolean).join(" – ");
}


/* ===== Card do imóvel (inline) ===== */
/* ===== Card do imóvel (inline) ===== */
function PropertyCard({ p }: { p: any }) {
  const areaNum = readArea(p);
  const areaStr = typeof areaNum === "number" ? `${areaNum.toLocaleString("pt-BR")} m²` : null;

  const precoNum = readPrice(p);
  const isSold = precoNum === -1;

  const precoStr =
    precoNum === undefined || precoNum === null ? null
    : isSold ? "VENDIDO"
    : precoNum === 0 ? "SOB CONSULTA"
    : (p.moeda || "BRL") === "BRL"
      ? precoNum.toLocaleString("pt-BR", { style: "currency", currency: "BRL" })
      : String(precoNum);

  const compNum  = coerceNumAny(p?.valor_comparativo);
  const compStr  = compNum && compNum > 0 ? (
    (p.moeda || "BRL") === "BRL"
      ? compNum.toLocaleString("pt-BR", { style: "currency", currency: "BRL" })
      : String(compNum)
  ) : null;

  const hasDiscount = !isSold && typeof precoNum === "number" && typeof compNum === "number" && compNum > precoNum;

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
            className={`w-full h-full object-cover ${isSold ? "grayscale-[40%]" : ""}`}
          />
        )}

        {/* faixa 'VENDIDO' */}
        {isSold && (
          <span
          className="absolute top-[24px] right-[-32px] rotate-45 bg-rose-600 text-white font-bold text-xs tracking-wider shadow-md flex items-center justify-center"
          style={{
            width: "140px",
            height: "28px",
            letterSpacing: ".05em",
            textAlign: "center",
            lineHeight: "28px",
            transform: "rotate(45deg)",
          }}
        >
          VENDIDO
        </span>
        )}

        {/* selo de desconto (mantido) */}
        {hasDiscount && (
          <span className="absolute top-3 left-3 bg-rose-600 text-white text-xs px-2 py-1 rounded">
            PREÇO BAIXOU
          </span>
        )}
      </div>

      <div className="p-3 space-y-1.5">
        <div className="text-[11px] uppercase tracking-wider text-zinc-500">Cód: {p.id}</div>

        <div className="text-base md:text-lg font-semibold leading-snug">
          {p.titulo || "Imóvel"}
        </div>

        {p.endereco && <div className="text-xs text-zinc-600">{p.endereco}</div>}

        {areaStr && <div className="text-xs text-zinc-600">{areaStr}</div>}

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


type LatLng = { lat: number; lng: number };

function parsePolyParam(param?: string | null): LatLng[] | null {
  if (!param) return null;
  try {
    const raw = decodeURIComponent(param);
    const parts = raw.split(";").map(s => s.trim()).filter(Boolean);
    const coords: LatLng[] = [];
    for (const p of parts) {
      const [latS, lngS] = p.split(",").map(s => s.trim());
      const lat = Number(latS);
      const lng = Number(lngS);
      if (Number.isFinite(lat) && Number.isFinite(lng)) {
        coords.push({ lat, lng });
      }
    }
    return coords.length >= 3 ? coords : null;
  } catch {
    return null;
  }
}

// Checagem rápida por bounding-box (acelera)
function inBBox(pt: LatLng, poly: LatLng[]): boolean {
  let minLat = Infinity, maxLat = -Infinity, minLng = Infinity, maxLng = -Infinity;
  for (const v of poly) {
    if (v.lat < minLat) minLat = v.lat;
    if (v.lat > maxLat) maxLat = v.lat;
    if (v.lng < minLng) minLng = v.lng;
    if (v.lng > maxLng) maxLng = v.lng;
  }
  return pt.lat >= minLat && pt.lat <= maxLat && pt.lng >= minLng && pt.lng <= maxLng;
}

// Ray casting (lat/lng): retorna true se ponto dentro do polígono
function pointInPolygon(p: LatLng, poly: LatLng[]): boolean {
  let inside = false;
  for (let i = 0, j = poly.length - 1; i < poly.length; j = i++) {
    const xi = poly[i].lng, yi = poly[i].lat;
    const xj = poly[j].lng, yj = poly[j].lat;
    const intersect =
      (yi > p.lat) !== (yj > p.lat) &&
      p.lng < ((xj - xi) * (p.lat - yi)) / (yj - yi) + xi;
    if (intersect) inside = !inside;
  }
  return inside;
}

/* ===== Página Home (com filtro via searchParams) ===== */
export default async function Home({
  searchParams,
}: {
  searchParams: {
    uf?: string;
    minArea?: string;
    maxArea?: string;
    minPreco?: string;
    maxPreco?: string;
    poly?: string; // <-- incluímos poly aqui para satisfazer o TS
  };
}) {
  const props = await listProperties();
  const bannerSrc = "/content/home/banner.jpg"; // public/content/home/banner.jpg
  const poly = parsePolyParam(searchParams.poly);

  // --- FILTRO SERVER-SIDE ---
  const uf = (searchParams.uf || "").toUpperCase().trim();
  const minArea = coerceNumAny(searchParams.minArea);
  const maxArea = coerceNumAny(searchParams.maxArea);
  const minPreco = coerceNumAny(searchParams.minPreco);
  const maxPreco = coerceNumAny(searchParams.maxPreco);

  const filtered = props.filter((p) => {
    // UF (busca por ", XX" no endereço ou terminações comuns)
    if (uf) {
      const hasUf =
        typeof p.endereco === "string" &&
        new RegExp(`(?:,\\s*|\\b)${uf}(?:\\b|$)`, "i").test(p.endereco);
      if (!hasUf) return false;
    }

    // Área m²
    const area = readArea(p);
    if (typeof minArea === "number" && (area ?? -Infinity) < minArea) return false;
    if (typeof maxArea === "number" && (area ?? Infinity) > maxArea) return false;

    // Preço
    const preco = readPrice(p);
    if (typeof minPreco === "number" && (preco ?? -Infinity) < minPreco) return false;
    if (typeof maxPreco === "number" && (preco ?? Infinity) > maxPreco) return false;

    // Polígono (se houver ?poly=)
    if (poly) {
      const ll = normalizeLatLng((p as any).geo);
      if (!ll) return false;                 // imóvel sem geo não entra
      if (!inBBox(ll, poly)) return false;   // descarte rápido
      if (!pointInPolygon(ll, poly)) return false; // teste preciso
    }

    return true;
  });

  // Mensagem do estado vazio (diferencia se veio polígono)
  const emptyMsg = poly
    ? "Não encontramos resultados nessa região. Ainda podemos ter o que procura à venda de forma privada — entre em contato para mais informações."
    : "Não encontramos nada parecido na busca. Ainda podemos ter o que procura à venda de forma privada — entre em contato para mais informações.";

  return (
    <main className="pt-0">
      {/* Banner (full-bleed se tiver a classe .full-bleed no CSS global) */}
      <section aria-label="Banner" className="w-full">
        <div className="full-bleed">
          <img
            src={bannerSrc}
            alt="Banner"
            className="block w-full h-auto object-cover object-center"
          />
        </div>
      </section>

      {/* Conteúdo: Filtro + Grid */}
      <section className="max-w-6xl mx-auto px-3 space-y-6 mt-6 pb-16">
        {/* Filtro visível */}
        <HomeFilters />

        <h1 className="text-2xl md:text-3xl font-semibold">Imóveis em destaque</h1>

        {/* Grid OU estado vazio */}
        {filtered.length > 0 ? (
          <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {filtered.map((p) => (
              <PropertyCard key={p.id} p={p} />
            ))}
          </div>
        ) : (
          <EmptyState className="mt-2" message={emptyMsg} />
        )}
      </section>
    </main>
  );
}
