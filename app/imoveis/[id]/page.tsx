import { notFound, redirect } from "next/navigation";
import dynamic from "next/dynamic";
import type { Metadata } from "next";
import { headers } from "next/headers";

import ShareButton from "@/app/components/ShareButton";
import PhotoGallery from "@/app/components/PhotoGallery";
import Async3DViewer from "@/app/components/Async3DViewer";
import { normalizeLatLng } from "@/lib/geo";
import { getPropertyBySlugOrId, listProperties } from "@/lib/properties";
import { getThreeDPageUrl } from "@/lib/three";

const MapClient = dynamic(() => import("@/app/components/MapClient"), {
  ssr: false,
});

/* =========================================================
   Helpers
========================================================= */

function absoluteUrl(p: string, host: string) {
  if (/^https?:\/\//i.test(p)) return p;
  return `https://${host}${p.startsWith("/") ? p : `/${p}`}`;
}

/* =========================================================
   METADATA (OG / WHATSAPP)
========================================================= */

export async function generateMetadata(
  { params }: { params: { id: string } }
): Promise<Metadata> {

  const input = params.id;

  const prop = await getPropertyBySlugOrId(input).catch(() => null);

  if (!prop) {
    return {
      title: "Imóvel | P-Link Imóveis",
      description: "Imóveis comerciais, residenciais e industriais no Brasil.",
    };
  }

  const title =
    prop.titulo || "Imóvel | P-Link Imóveis";

  const description =
    Array.isArray(prop.descricao)
      ? prop.descricao[0]
      : prop.descricao ||
        "Imóveis comerciais, residenciais e industriais no Brasil.";

  const hdrs = headers();
  const host =
    hdrs.get("x-forwarded-host") ||
    hdrs.get("host") ||
    "www.p-linkimoveis.com.br";

  const canonicalSlug = prop.slug || prop.id;
  const url = absoluteUrl(`/imoveis/${canonicalSlug}`, host);

  /* =========================================================
     OG IMAGE (sem filesystem)
  ========================================================= */

  let ogImage = absoluteUrl("/og-preview.jpg", host);

  // Se existir foto, usar a primeira
  if (prop.fotos?.length > 0) {
    ogImage = absoluteUrl(prop.fotos[0], host);
  }

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
      images: [
        {
          url: ogImage,
          width: 1200,
          height: 630,
        },
      ],
    },

    twitter: {
      card: "summary_large_image",
      title,
      description,
      images: [ogImage],
    },

    robots: {
      index: true,
      follow: true,
    },
  };
}

/* =========================================================
   PAGE
========================================================= */

export default async function PropertyPage({
  params,
}: {
  params: { id: string };
}) {
  const prop = await getPropertyBySlugOrId(params.id).catch(() => null);

  if (!prop) notFound();

  // 🔁 ID → SLUG
  if (
    params.id.toLowerCase() === String(prop.id).toLowerCase() &&
    prop.slug &&
    params.id !== prop.slug
  ) {
    redirect(`/imoveis/${prop.slug}`);
  }

  const code = String(prop.id).toUpperCase();

  const viewer3d =
    prop.viewer3d?.length
      ? prop.viewer3d
      : getThreeDPageUrl(code);

  const ll = normalizeLatLng(prop.geo);

  const all = await listProperties();
  const sims = all.filter((p) => p.id !== prop.id).slice(0, 5);

  return (
    <article className="space-y-6 max-w-6xl mx-auto px-3">

      <header className="space-y-2">
        <div className="text-xs uppercase text-zinc-500">
          Cód: {prop.id}
        </div>

        <h1 className="text-2xl md:text-3xl font-semibold">
          {prop.titulo}
        </h1>

        <div className="text-sm text-zinc-600">
          {prop.endereco}
        </div>

        <ShareButton />
      </header>

      {prop.fotos?.length > 0 && (
        <PhotoGallery
          images={prop.fotos}
          title={prop.titulo}
        />
      )}

      {prop.descricao && (
        <section>
          <h2 className="text-lg font-semibold mb-2">
            Descrição
          </h2>

          {Array.isArray(prop.descricao)
            ? prop.descricao.map((t: string, i: number) => (
                <p key={i} className="leading-relaxed">
                  {t}
                </p>
              ))
            : <p>{prop.descricao}</p>}
        </section>
      )}

      {ll && (
        <section>
          <h2 className="text-lg font-semibold mb-2">
            Localização
          </h2>

          <MapClient
            points={[
              {
                id: prop.id,
                titulo: prop.titulo,
                endereco: prop.endereco,
                geo: ll,
              },
            ]}
            style={{ height: 500 }}
            fitToPoints
          />
        </section>
      )}

      {viewer3d && (
        <Async3DViewer
          url={viewer3d}
          code={code}
        />
      )}

      {sims.length > 0 && (
        <section>
          <h2 className="text-lg font-semibold mb-3">
            Você também pode gostar
          </h2>

          <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {sims.map((p) => (
              <a
                key={p.id}
                href={`/imoveis/${p.slug || p.id}`}
                className="border rounded-xl overflow-hidden"
              >
                {p.fotos?.[0] && (
                  <img
                    src={p.fotos[0]}
                    alt={p.titulo}
                    className="aspect-video object-cover w-full"
                  />
                )}

                <div className="p-3">
                  <div className="text-xs text-zinc-500">
                    Cód: {p.id}
                  </div>

                  <div className="font-semibold">
                    {p.titulo}
                  </div>

                  <div className="text-xs text-zinc-600">
                    {p.endereco}
                  </div>
                </div>
              </a>
            ))}
          </div>
        </section>
      )}

    </article>
  );
}
