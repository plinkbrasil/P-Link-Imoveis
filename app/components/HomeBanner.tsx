// -*- app/components/HomeBanner.tsx -*-
import fs from "node:fs/promises";
import path from "node:path";

async function detectHomeBanner(): Promise<string | null> {
  const publicDir = path.join(process.cwd(), "public");
  const homeDir = path.join(publicDir, "content", "home");
  const candidates = ["banner.avif", "banner.webp", "banner.jpg", "banner.jpeg", "banner.png"];

  for (const name of candidates) {
    try { await fs.access(path.join(homeDir, name)); return "/content/home/" + name; } catch {}
  }
  const baseNames = ["banner-home.avif", "banner-home.webp", "banner-home.jpg", "banner-home.jpeg", "banner-home.png"];
  for (const name of baseNames) {
    try { await fs.access(path.join(publicDir, name)); return "/" + name; } catch {}
  }
  return null;
}

export default async function HomeBanner() {
  const src = await detectHomeBanner();
  if (!src) return null;
  return (
    <div className="relative left-1/2 -translate-x-1/2 w-screen mt-[-32px]">
      <img src={src} alt="Banner" className="w-screen h-auto block select-none pointer-events-none" />
    </div>
  );
}
