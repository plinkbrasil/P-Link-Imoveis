// -*- app/sitemap.ts -*-
import type { MetadataRoute } from "next";
import { listProperties } from "@/lib/properties";

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const base = "https://www.p-linkimoveis.com.br";
  const props = await listProperties();

  return [
    { url: `${base}/`, changeFrequency: "daily", priority: 1 },
    { url: `${base}/mapa`, changeFrequency: "daily", priority: 0.7 },
    { url: `${base}/contato`, changeFrequency: "yearly", priority: 0.2 },
    ...props.map((p) => ({
      url: `${base}/imoveis/${p.slug || p.id}`,
      changeFrequency: "weekly" as const,
      priority: 0.8,
    })),
  ];
}
