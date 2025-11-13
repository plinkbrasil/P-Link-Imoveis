// -*- app/layout.tsx -*-
import "./globals.css";
import "leaflet/dist/leaflet.css";
import type { Metadata } from "next";
import Script from "next/script"; // ← IMPORTANTE
import HeaderSearch from "@/app/components/HeaderSearch";
import HeaderSizer from "@/app/components/HeaderSizer";
import WhatsAppFloat from "@/app/components/WhatsAppFloat";
import { listProperties } from "@/lib/properties";
import { FaInstagram } from "react-icons/fa";

export const metadata: Metadata = {
  metadataBase: new URL("https://www.p-linkimoveis.com.br"),
  title: { template: "%s | P-Link Imóveis", default: "P-Link Imóveis" },
  description: "Terrenos, áreas comerciais e imóveis de alto valor para investimento no Brasil e exterior.",
  openGraph: { type: "website", siteName: "P-Link Imóveis", locale: "pt_BR" },
  alternates: { canonical: "/" },
};

export default async function RootLayout({ children }: { children: React.ReactNode }) {
  const props = await listProperties();
  const items = props.map((p) => ({
    id: p.id,
    slug: p.slug,
    titulo: p.titulo,
    endereco: p.endereco,
    area_m2: p.area_m2,
    preco: p.preco,
    moeda: p.moeda,
  }));

  const websiteLd = {
    "@context": "https://schema.org",
    "@type": "WebSite",
    url: "https://www.p-linkimoveis.com.br/",
    potentialAction: {
      "@type": "SearchAction",
      target: "https://www.p-linkimoveis.com.br/?q={search_term_string}",
      "query-input": "required name=search_term_string",
    },
  };

  const orgLd = {
    "@context": "https://schema.org",
    "@type": "RealEstateAgent",
    name: "P-Link Imóveis",
    url: "https://www.p-linkimoveis.com.br/",
    logo: "https://www.p-linkimoveis.com.br/logo.svg",
    sameAs: ["https://www.instagram.com/paulo.stephens"],
    telephone: "+55 41 98709-8082",
  };

  return (
    <html lang="pt-BR">
      <head>
        {/* ===== GOOGLE ANALYTICS (GA4) ===== */}
        <Script
          strategy="afterInteractive"
          src="https://www.googletagmanager.com/gtag/js?id=G-EV9BETS2QY" 
        />
        <Script id="ga4-script" strategy="afterInteractive">
          {`
            window.dataLayer = window.dataLayer || [];
            function gtag(){dataLayer.push(arguments);}
            gtag('js', new Date());
            gtag('config', 'G-EV9BETS2QY');
          `}
        </Script>
        {/* ================================= */}
      </head>

      <body className="min-h-screen bg-white text-zinc-900">
        <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(websiteLd) }} />
        <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(orgLd) }} />

        <header className="sticky top-0 z-[2000] bg-gradient-to-r from-[#0c0f14]/90 to-[#0a454f]/90 backdrop-blur-sm">
          <HeaderSizer />
          <div className="mx-auto max-w-6xl px-4 py-3 grid grid-cols-3 items-center">
            <nav className="justify-self-start flex gap-4 sm:gap-6 text-xs sm:text-sm font-semibold uppercase tracking-wide">
              <a href="/" className="text-white hover:text-white/90">Home</a>
              <a href="/mapa" className="text-white hover:text-white/90">Mapa</a>
            </nav>

            {/* LOGO */}
            <a
              href="/"
              aria-label="P-Link Imóveis"
              title="P-Link Imóveis"
              className="flex items-center justify-center"
              style={{ lineHeight: 0 }}
            >
              <img
                src="/logo.svg"
                alt="P-Link Imóveis"
                className="h-10 sm:h-12 md:h-16 w-auto object-contain select-none"
                draggable={false}
              />
            </a>

            <div className="justify-self-end flex items-center gap-2 sm:gap-3">
              <HeaderSearch items={items} />
              <a
                href="https://www.instagram.com/paulo.stephens"
                target="_blank"
                rel="noopener noreferrer"
                className="flex items-center justify-center w-9 h-9 sm:w-10 sm:h-10 border border-white/30 rounded-full text-white hover:bg-white/10 transition"
                aria-label="Instagram"
                title="Instagram"
              >
                <FaInstagram className="w-4 h-4 sm:w-5 sm:h-5" />
              </a>
            </div>
          </div>
        </header>

        <main>{children}</main>

        <WhatsAppFloat phoneE164="+5541987098082" message="Olá! Vim pelo site P-Link Imóveis." />

        <footer className="border-t border-brand-200">
          <div className="mx-auto max-w-6xl px-4 py-8 text-sm text-zinc-600">
            © {new Date().getFullYear()} P-Link Imóveis — P-Link.
          </div>
        </footer>
      </body>
    </html>
  );
}
