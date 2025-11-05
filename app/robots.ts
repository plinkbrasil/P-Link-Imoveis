// -*- app/robots.ts -*-
import type { MetadataRoute } from "next";

export default function robots(): MetadataRoute.Robots {
  return {
    rules: [{ userAgent: "*", allow: "/" }],
    sitemap: "https://www.p-linkimoveis.com.br/sitemap.xml",
  };
}
