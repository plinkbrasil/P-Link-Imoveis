
import type { WithContext, RealEstateListing, Offer, BreadcrumbList } from "schema-dts";
import type { Property } from "./properties";

export function listingJsonLd(p: Property): WithContext<RealEstateListing> {
  const offer: Offer = {
    "@type": "Offer",
    priceCurrency: p.moeda || "BRL",
    price: String(p.preco || ""),
    availability: "https://schema.org/InStock"
  };

  return {
    "@context": "https://schema.org",
    "@type": "RealEstateListing",
    name: p.titulo,
    url: `https://www.suaimobiliaria.com.br/imoveis/${p.slug || p.id}`,
    address: p.endereco,
    geo: p.geo ? { "@type": "GeoCoordinates", latitude: p.geo.lat, longitude: p.geo.lng } : undefined,
    description: p.descricao,
    offers: offer
  };
}

export function breadcrumbJsonLd(p: Property): WithContext<BreadcrumbList> {
  return {
    "@context": "https://schema.org",
    "@type": "BreadcrumbList",
    itemListElement: [
      { "@type": "ListItem", position: 1, name: "Home", item: "https://www.suaimobiliaria.com.br/" },
      { "@type": "ListItem", position: 2, name: "Imóveis", item: "https://www.suaimobiliaria.com.br/" },
      { "@type": "ListItem", position: 3, name: p.titulo, item: `https://www.suaimobiliaria.com.br/imoveis/${p.slug || p.id}` }
    ]
  };
}
