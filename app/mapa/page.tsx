// -*- app/mapa/page.tsx -*-
import { listProperties } from "@/lib/properties";
import dynamic from "next/dynamic";
import { normalizeLatLng } from "@/lib/geo";

const MapClient = dynamic(() => import("@/app/components/MapClient"), { ssr: false });

export const metadata = {
  title: "Mapa",
  alternates: { canonical: "/mapa" },
};

type Pt = {
  id: string;
  slug?: string;
  titulo?: string;
  endereco?: string;
  geo: { lat: number; lng: number };
  preco?: number | string;
  moeda?: string;
  area_m2?: number | string;
  fotos?: string[];
};

export default async function MapaPage() {
  const props = await listProperties();

  const pts: Pt[] = props
    .map((p) => {
      const ll = normalizeLatLng((p as any).geo);
      if (!ll) return null;
      return {
        id: String(p.id),
        slug: p.slug,
        titulo: p.titulo,
        endereco: p.endereco,
        geo: ll,
        preco: (p as any).preco,
        moeda: (p as any).moeda,
        area_m2: (p as any).area_m2,
        // >>> necessário para o popup mostrar a primeira foto
        fotos: Array.isArray((p as any).fotos) ? (p as any).fotos : undefined,
      };
    })
    .filter(Boolean) as Pt[];

  const fullBleedStyle: React.CSSProperties = {
    marginLeft: "calc(50% - 50vw)",
    marginRight: "calc(50% - 50vw)",
  };

  return (
    <div style={fullBleedStyle}>
      {/* Spacer que imita a altura dinâmica do header */}
      <div style={{ height: "var(--header-h, 0px)" }} />
      <MapClient
        points={pts}
        className="w-screen"
        style={{ height: "calc(100vh - var(--header-h, 80px))", minHeight: 420 }}
        enableDraw={true}   // garante a barra de desenho (polígono)
        fitToPoints         // enquadra todos os pontos
      />
    </div>
  );
}
