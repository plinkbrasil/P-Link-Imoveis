import fs from "node:fs/promises";
import path from "node:path";
import fg from "fast-glob";

export type Property = {
  id: string;         // nome da pasta
  slug: string;
  titulo: string;
  endereco?: string;
  preco?: number;
  moeda?: string;
  valor_comparativo?: number;
  area_m2?: number;
  geo?: { lat: number; lng: number } | { lat: string; lng: string };
  fotos: string[];    // urls públicas (/content/properties/...)
  viewer3d?: string;  // /content/properties/.../index.html se existir
  descricao?: string;
  descricao_html?: string;
  diferenciais?: string[] | string;
  [key: string]: any;
};

// === Caminho base: /public/content/properties ===
const BASE = path.join(process.cwd(), "public", "content", "properties");

function toSlug(s: string, fallback: string) {
  try {
    const v = String(s)
      .normalize('NFD')
      .replace(/[\u0300-\u036f]/g, '') // tira acento
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, '-')
      .replace(/^-+|-+$/g, '');
    return v || fallback;
  } catch { return fallback; }
}

function coerceNum(x: any): number | undefined {
  if (typeof x === "number" && Number.isFinite(x)) return x;
  if (typeof x === "string") {
    const s = x.trim().replace(/\./g, "").replace(",", ".").replace(/[^0-9.\-]/g, "");
    const n = Number(s);
    return Number.isFinite(n) ? Math.round(n) : undefined;
  }
  return undefined;
}

export async function listProperties(): Promise<Property[]> {
  let dirs: string[] = [];
  try {
    const entries = await fs.readdir(BASE, { withFileTypes: true });
    dirs = entries.filter(e => e.isDirectory()).map(e => e.name);
  } catch {
    return [];
  }

  const items: Property[] = [];
  for (const id of dirs) {
    const dir = path.join(BASE, id);
    // meta.json opcional
    let meta: any = {};
    try {
      const buf = await fs.readFile(path.join(dir, "meta.json"), "utf8");
      meta = JSON.parse(buf);
    } catch {}

    // fotos: raiz e também /fotos/**
    const found = await fg(
      ["*.{jpg,jpeg,png,webp,avif}", "fotos/**/*.{jpg,jpeg,png,webp,avif}"],
      { cwd: dir, caseSensitiveMatch: false }
    );
    const relFotos = (Array.isArray(meta.fotos) && meta.fotos.length ? meta.fotos : found)
      .map((f: string) => f.replace(/\\/g, "/"));
    const fotos = relFotos.map((f) => `/content/properties/${id}/${f}`);

    const titulo = meta.titulo || id;
    const slug = meta.slug || toSlug(titulo, id);

    const preco = coerceNum(meta.preco ?? meta.valor ?? meta.price);
    const valor_comparativo = coerceNum(meta.valor_comparativo ?? meta.preco_comparativo ?? meta.preco_original ?? meta.precoAntigo);
    const area_m2 = coerceNum(meta.area_m2 ?? meta.area ?? meta.m2 ?? meta.metragem);

    // 3D (index.html) em subpastas comuns
    let viewer3d: string | undefined;
    try {
      const found3d = await fg(["3d/**/index.html", "web3d/**/index.html", "qgis3d/**/index.html"], { cwd: dir, caseSensitiveMatch: false });
      if (found3d?.[0]) viewer3d = `/content/properties/${id}/${found3d[0].replace(/\\/g, "/")}`;
    } catch {}

    items.push({
      id, slug, titulo,
      endereco: meta.endereco || meta.local || meta.cidade || "",
      preco, moeda: meta.moeda || "BRL",
      valor_comparativo, area_m2,
      geo: meta.geo,
      fotos, viewer3d,
      descricao: meta.descricao ?? meta.description ?? meta.detalhes,
      descricao_html: meta.descricao_html,
      diferenciais: meta.diferenciais ?? meta.features ?? meta.itens,
      ...meta,
    });
  }
  // ordena por id desc
  items.sort((a,b) => String(b.id).localeCompare(String(a.id)));
  return items;
}

export async function getPropertyBySlugOrId(idOrSlug: string): Promise<Property | null> {
  const all = await listProperties();
  const q = decodeURIComponent(idOrSlug);
  const qLower = q.toLowerCase();
  return all.find((p) => p.id === q || p.slug === q || p.id.toLowerCase() === qLower || p.slug.toLowerCase() === qLower) || null;
}
