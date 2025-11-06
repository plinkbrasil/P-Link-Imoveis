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
    address,
    geo,
  };

  const ldJson: any = {
    "@context": "https://schema.org",
    "@type": "RealEstateListing",
    name: p.titulo,
    url: `https://www.suaimobiliaria.com.br/imoveis/${p.slug || p.id}`,
    address: p.endereco, // fica aceito porque o objeto é any
    geo: p.geo ? { "@type": "GeoCoordinates", latitude: p.geo.lat, longitude: p.geo.lng } : undefined,
    description: p.descricao,
    offers: offer
  };

  const offer: Offer | undefined =
    typeof p.preco === "number" && p.preco > 0
      ? {
          "@type": "Offer",
          price: p.preco,
          priceCurrency: p.moeda || "BRL",
          availability: "https://schema.org/InStock",
        }
      : undefined;

  return {
    "@context": "https://schema.org",
    "@type": "RealEstateListing",
    name: p.titulo,
    url: `https://www.suaimobiliaria.com.br/imoveis/${p.slug || p.id}`,
    description:
      Array.isArray(p.descricao) ? p.descricao.join(" ") : p.descricao || undefined,
    itemOffered,
    offers: offer,
  };
}
