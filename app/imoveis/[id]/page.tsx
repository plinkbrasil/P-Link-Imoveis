import { notFound } from "next/navigation";
import ShareButton from "@/app/components/ShareButton";
import dynamic from "next/dynamic";
import { normalizeLatLng } from "@/lib/geo";
import { getPropertyBySlugOrId, listProperties } from "@/lib/properties";
import PhotoGallery from "@/app/components/PhotoGallery";
import { getThreeDPageUrl } from "@/lib/three";
import Async3DViewer from "@/app/components/Async3DViewer";
import type { Metadata } from "next";
import { headers } from "next/headers";

const MapClient = dynamic(() => import("@/app/components/MapClient"), { ssr: false });

/* ---------- Funções utilitárias ---------- */
function coerceNumAny(x: any): number | undefined {
  if (typeof x === "number" && Number.isFinite(x)) return x;
  if (typeof x === "string") {
    const n = Number(
      x.trim().replace(/\./g, "").replace(",", ".").replace(/[^0-9.\-]/g, "")
    );
    return Number.isFinite(n) ? Math.round(n) : undefined;
  }
  return undefined;
}

function readPrice(p: any): number | undefined {
  for (const k of ["preco", "price", "valor"]) {
    const n = coerceNumAny((p as any)[k]);
    if (n !== undefined) return n;
  }
  return undefined;
}

function readArea(p: any): number | undefined {
  for (const k of ["area_m2", "area", "metragem", "tamanho", "m2"]) {
    const n = coerceNumAny((p as any)[k]);
    if (n !== undefined) return n;
  }
  return undefined;
}

function firstTextFromDescricao(desc: any): string {
  const parts: string[] = Array.isArray(desc)
    ? desc
    : typeof desc === "string"
    ? desc.split(/\r?\n\r?\n+/).map((s) => s.trim()).filter(Boolean)
    : [];
  const first = (parts[0] || "").replace(/^"+|"+$/g, "").trim();
  return first;
}

function clampMeta(s: string, max = 160): string {
  if (s.length <= max) return s;
  const cut = s.slice(0, max);
  const i = Math.max(cut.lastIndexOf("."), cut.lastIndexOf(","), cut.lastIndexOf(" "));
  return (i > 60 ? cut.slice(0, i) : cut).trim();
}

/** Quebra "Bairro, Cidade, UF" em partes (quando possível) */
function parseAddress(endereco: any): { bairro?: string; cidade?: string; uf?: string } {
  const s = typeof endereco === "string" ? endereco : "";
  const parts = s.split(",").map((p) => p.trim()).filter(Boolean);
  if (parts.length === 3) return { bairro: parts[0], cidade: parts[1], uf: parts[2] };
  if (parts.length === 2) return { cidade: parts[0], uf: parts[1] };
  if (parts.length === 1) return { cidade: parts[0] };
  return {};
}

/** Normaliza o tipo em minúsculas para testes simples */
function normTipo(prop: any): string {
  const raw = String(prop?.tipo || prop?.titulo || "Imóvel").toLowerCase();
  return raw.normalize("NFD").replace(/[\u0300-\u036f]/g, "");
}

// TÍTULO: usa apenas o que veio no meta.json
function buildTitle(prop: any): string {
  if (prop?.titulo && typeof prop.titulo === "string") return prop.titulo.trim();

  // fallback mínimo (só se faltar titulo no meta.json)
  const metragem =
    typeof prop?.area_m2 === "number"
      ? `${prop.area_m2.toLocaleString("pt-BR")} m²`
      : "";
  const endereco = typeof prop?.endereco === "string" ? prop.endereco : "P-Link Imóveis";
  return ["Imóvel à Venda", metragem, endereco].filter(Boolean).join(" – ");
}


/** DESCRIÇÃO CONTEXTUAL (fallback) */
function buildDescription(prop: any): string {
  const tipoNorm = normTipo(prop);
  const cidadeUF = typeof prop?.endereco === "string" ? prop.endereco : "";
  const parts: string[] = Array.isArray(prop?.descricao)
    ? prop.descricao
    : typeof prop?.descricao === "string"
    ? prop.descricao.split(/\r?\n\r?\n+/).map((s: string) => s.trim()).filter(Boolean)
    : [];

  // pega o primeiro parágrafo "substancial"
  let base = "";
  for (const p of parts) {
    const clean = p.replace(/^"+|"+$/g, "").trim();
    if (clean.length >= 60) { base = clean; break; }
  }
  if (!base) base = firstTextFromDescricao(prop?.descricao);

  // fallback contextual por tipo
  let cauda = "ideal para investimento, logística ou uso industrial";
  if (/(casa|sobrado|apart|studio|kitnet|cobertura)/.test(tipoNorm)) {
    cauda = "excelente opção residencial, com conforto e localização privilegiada";
  } else if (/(hotel|pousada|flat)/.test(tipoNorm)) {
    cauda = "ideal para hospitalidade, turismo e operações de médio a grande porte";
  }

  const fallback = [
    prop?.tipo || "Imóvel",
    typeof prop?.area_m2 === "number" ? `${prop.area_m2.toLocaleString("pt-BR")} m²` : "",
    cidadeUF ? `em ${cidadeUF}` : "",
    cauda
  ].filter(Boolean).join(" ");

  const raw = base && base.length > 40 ? base : fallback;
  return clampMeta(raw, 160);
}

function absoluteUrl(path: string, host?: string) {
  const h = host || "www.plinkimoveis.com.br";
  if (/^https?:\/\//.test(path)) return path;
  return `https://${h}${path.startsWith("/") ? path : `/${path}`}`;
}

export async function generateMetadata(
  { params }: { params: { id: string } }
): Promise<Metadata> {
  const prop = await getPropertyBySlugOrId(params.id).catch(() => null);

  const title = prop ? buildTitle(prop) : "Imóvel | P-Link Imóveis";
  const description = prop ? buildDescription(prop) : "Imóveis comerciais, residenciais e industriais na RMC.";

  const hdrs = headers();
  const host = hdrs.get("x-forwarded-host") || hdrs.get("host") || "www.plinkimoveis.com.br";
  const slugOrId = (prop as any)?.slug || params.id;
  const url = absoluteUrl(`/imoveis/${slugOrId}`, host);

  const firstPhoto = Array.isArray((prop as any)?.fotos) ? String((prop as any)!.fotos[0] || "") : "";
  const isHttpUrl = /^https?:\/\//i.test(firstPhoto) || firstPhoto.startsWith("/");
  const ogImage = isHttpUrl ? absoluteUrl(firstPhoto, host) : absoluteUrl("/og/plink-default.jpg", host);

  return {
    title,
    description,
    alternates: { canonical: url },
    openGraph: {
      type: "article",
      url,
      title,
      description,
      siteName: "P-Link Imóveis",
      images: [{ url: ogImage }]
    },
    twitter: {
      card: "summary_large_image",
      title,
      description,
      images: [ogImage]
    },
    robots: {
      index: true,
      follow: true
    }
  };
}

/* ---------- Página principal (SERVER COMPONENT) ---------- */
export default async function PropertyPage({ params }: { params: { id: string } }) {
  const prop = await getPropertyBySlugOrId(params.id).catch(() => null);
  if (!prop) notFound();

  // Monta link do 3D por código (respeita se já vier setado no meta)
  const code = String((prop as any).id ?? "").toUpperCase().trim();
  const viewer3d: string | undefined =
    (prop as any).viewer3d && (prop as any).viewer3d.length > 0
      ? (prop as any).viewer3d
      : code
      ? getThreeDPageUrl(code)
      : undefined;

      const precoNum = readPrice(prop);
      const isSold = precoNum === -1;
    
      const compNum  = (prop as any).valor_comparativo as number | undefined;
      const hasDiscount =
        !isSold &&
        (typeof precoNum === "number" && typeof compNum === "number" && compNum > 0 && compNum > precoNum);
    
      const precoStr =
        precoNum === undefined || precoNum === null ? null
        : isSold ? "VENDIDO"
        : precoNum === 0 ? "SOB CONSULTA"
        : precoNum === -1 ? "VENDIDO"
        : (prop.moeda === "BRL" ? precoNum.toLocaleString("pt-BR", { style: "currency", currency: "BRL" }) : String(precoNum));
    
      const compStr =
        typeof compNum !== "number" ? null
        : (prop.moeda === "BRL" ? compNum.toLocaleString("pt-BR", { style: "currency", currency: "BRL" }) : String(compNum));
    

  const ll = normalizeLatLng((prop as any).geo);

  const all = await listProperties();
  const ufFrom =
    (prop as any).endereco?.match(/[,\-]\s*([A-Z]{2})(?:\b|$)/i)?.[1]?.toUpperCase() || "";

  const sims = all
    .filter((p) => p.id !== (prop as any).id)
    .map((p) => {
      const uf = p.endereco?.match(/[,\-]\s*([A-Z]{2})(?:\b|$)/i)?.[1]?.toUpperCase() || "";
      const score =
        (uf && uf === ufFrom ? 0 : 1) * 1000 +
        Math.abs((readArea(p) || 0) - (readArea(prop) || 0)) / 100 +
        Math.abs((readPrice(p) || 0) - (readPrice(prop) || 0)) / 1000;
      return { p, score };
    })
    .sort((a, b) => a.score - b.score)
    .slice(0, 5)
    .map((x) => x.p);

  // -------- JSON-LD (dados estruturados) --------
  const ldJson = {
    "@context": "https://schema.org",
    "@type": "RealEstateListing",
    name: buildTitle(prop),
    description: buildDescription(prop),
    url: absoluteUrl(`/imoveis/${(prop as any).slug || (prop as any).id}`),
    address: {
      "@type": "PostalAddress",
      streetAddress: (prop as any).endereco || "",
      addressLocality:
        ((prop as any).endereco || "").split(",")[0]?.trim() || "Fazenda Rio Grande",
      addressRegion: "PR",
      addressCountry: "BR",
    },
    geo: (prop as any).geo
      ? {
          "@type": "GeoCoordinates",
          latitude: (prop as any).geo.lat,
          longitude: (prop as any).geo.lng,
        }
      : undefined,
    offers:
      typeof (prop as any).preco === "number" && (prop as any).preco > 0
        ? {
            "@type": "Offer",
            price: (prop as any).preco,
            priceCurrency: (prop as any).moeda || "BRL",
            availability: "https://schema.org/InStock",
          }
        : undefined,
    areaServed: "Região Metropolitana de Curitiba",
  };

  return (
    <article className="space-y-6 pt-0 max-w-6xl mx-auto px-3">
      {/* JSON-LD dentro do JSX (ok no App Router) */}
      <script
        type="application/ld+json"
        
        dangerouslySetInnerHTML={{ __html: JSON.stringify(ldJson) }}
      />

      <header className="space-y-2">
      <div className="text-[11px] uppercase tracking-wider text-zinc-500">Cód: {prop.id}</div>

<div className="flex items-center gap-3 flex-wrap">
  <h1 className="text-2xl md:text-3xl font-semibold leading-tight">{prop.titulo}</h1>
  

</div>

<div className="text-sm text-zinc-600">{prop.endereco}</div>

<div className="mt-2 space-y-1">
  {hasDiscount && compStr && (<div className="text-base text-zinc-400 line-through">{compStr}</div>)}
  {precoStr && (
    <div className={`text-2xl font-semibold ${isSold ? "text-red-600" : "text-emerald-700"}`}>
      {precoStr}
    </div>
  )}
</div>

{/* Botão de compartilhar */}
<ShareButton />

      </header>

      {/* Fotos com galeria clicável */}
      {Array.isArray((prop as any).fotos) && (prop as any).fotos.length > 0 ? (
        <section>
          <PhotoGallery images={(prop as any).fotos} title={(prop as any).titulo} />
        </section>
      ) : null}

      {/* Descrição */}
      {(prop as any).descricao_html || (prop as any).descricao ? (
        <section className="space-y-2">
          <h2 className="text-lg font-semibold">Descrição</h2>

          {(prop as any).descricao_html ? (
            <div dangerouslySetInnerHTML={{ __html: (prop as any).descricao_html }} />
          ) : (
            (() => {
              const raw = (prop as any).descricao;
              const partes: string[] = Array.isArray(raw)
                ? raw
                : typeof raw === "string"
                ? raw.split(/\r?\n\r?\n+/).map((s) => s.trim()).filter(Boolean)
                : [];

              return (
                <div className="space-y-2">
                  {partes.map((txt, i) => (
                    <p key={i} className="leading-relaxed">
                      {txt}
                    </p>
                  ))}
                </div>
              );
            })()
          )}
        </section>
      ) : null}

      {/* Localização */}
      {ll ? (
        <section>
          <h2 className="text-lg font-semibold mb-2">Localização</h2>
          <div className="rounded-xl overflow-hidden border">
            <MapClient
              points={[
                {
                  id: (prop as any).id,
                  slug: (prop as any).slug,
                  titulo: (prop as any).titulo,
                  endereco: (prop as any).endereco,
                  geo: ll,
                  preco: (prop as any).preco,
                  moeda: (prop as any).moeda,
                  area_m2: (prop as any).area_m2,
                  
                },
              ]}
              className="w-full"
  style={{ height: 500, position: "relative", zIndex: 0 }}
  fitToPoints
            />
          </div>
        </section>
      ) : null}

      {/* 3D — checa existência via componente client separado */}
      {viewer3d && <Async3DViewer url={viewer3d} code={code} />}

      {/* Similares */}
      {sims.length ? (
  <section className="space-y-3">
    <h2 className="text-lg font-semibold">Você também pode gostar</h2>
    <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
      {sims.map((p) => {
        const precoNum =
          typeof (p as any).preco === "number" ? (p as any).preco :
          (typeof (p as any).preco === "string" ? Number(String((p as any).preco).replace(/\./g,"").replace(",",".").replace(/[^0-9.\-]/g,"")) : undefined);

        const isSold = precoNum === -1;

        const precoStr =
          precoNum === undefined || precoNum === null ? null
          : isSold ? "VENDIDO"
          : precoNum === 0 ? "SOB CONSULTA"
          : ((p as any).moeda || "BRL") === "BRL"
            ? precoNum.toLocaleString("pt-BR", { style: "currency", currency: "BRL" })
            : String(precoNum);

        return (
          <a key={p.id} href={`/imoveis/${p.slug || p.id}`} className="rounded-xl border hover:shadow transition overflow-hidden bg-white">
            {p.fotos?.[0] && (
              <div className="relative aspect-video bg-zinc-100">
                <img
                  src={p.fotos[0]}
                  alt={p.titulo}
                  className={`w-full h-full object-cover ${isSold ? "grayscale-[40%]" : ""}`}
                />
                {isSold && (
  <span
    className="absolute top-[14px] right-[-42px] rotate-45 bg-rose-600 text-white font-bold text-xs tracking-wider shadow-md flex items-center justify-center"
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

              </div>
            )}
            <div className="p-3">
              <div className="text-[11px] uppercase tracking-wider text-zinc-500">Cód: {p.id}</div>
              <div className="text-base md:text-lg font-semibold leading-snug">{p.titulo}</div>
              <div className="text-xs text-zinc-600">{p.endereco}</div>
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
          </a>
        );
      })}
    </div>
  </section>
) : null}

    </article>
  );
}
