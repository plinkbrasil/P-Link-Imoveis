// lib/seo.ts
import type {
  WithContext,
  RealEstateListing,
  Offer,
  Place,
  PostalAddress,
  GeoCoordinates,
} from "schema-dts";

type Prop = {
  id: string;
  slug?: string;
  titulo: string;
  descricao?: string | string[];
  endereco?: string;
  geo?: { lat: number; lng: number };
  preco?: number;
  moeda?: string;
};

/** Junta array de parágrafos em uma string curta e limpa */
function normalizeDescription(desc?: string | string[]): string | undefined {
  if (!desc) return undefined;
  if (Array.isArray(desc)) {
    const s = desc.join(" ").trim();
    return s.length ? s : undefined;
  }
  const s = String(desc).trim();
  return s.length ? s : undefined;
}

/** Monta o Offer somente se houver preço > 0 (ignora 0=SOB CONSULTA e -1=VENDIDO) */
function buildOffer(p: Prop): Offer | undefined {
  if (typeof p.preco !== "number" || p.preco <= 0) return undefined;
  return {
    "@type": "Offer",
    price: p.preco,
    priceCurrency: p.moeda || "BRL",
    availability: "https://schema.org/InStock",
  };
}

/** JSON-LD para página de imóvel */
export function buildJsonLdForProperty(p: Prop): WithContext<RealEstateListing> {
  const address: PostalAddress | undefined = p.endereco
    ? { "@type": "PostalAddress", streetAddress: p.endereco }
    : undefined;

  const geo: GeoCoordinates | undefined = p.geo
    ? { "@type": "GeoCoordinates", latitude: p.geo.lat, longitude: p.geo.lng }
    : undefined;

  const itemOffered: Place = {
    "@type": "Place",
    name: p.titulo,
    ...(address ? { address } : {}),
    ...(geo ? { geo } : {}),
  };

  const offer = buildOffer(p);
  const description = normalizeDescription(p.descricao);

  const jsonLd: WithContext<RealEstateListing> = {
    "@context": "https://schema.org",
    "@type": "RealEstateListing",
    name: p.titulo,
    url: `https://www.suaimobiliaria.com.br/imoveis/${p.slug || p.id}`,
    ...(description ? { description } : {}),
    itemOffered,
    ...(offer ? { offers: offer } : {}),
  };

  return jsonLd;
}
