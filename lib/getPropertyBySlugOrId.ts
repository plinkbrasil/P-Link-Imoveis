import { listProperties } from "@/lib/properties";

export default async function getPropertyBySlugOrId(idOrSlug: string) {
  const all = await listProperties();
  const q = decodeURIComponent(idOrSlug);
  const qLower = q.toLowerCase();

  return (
    all.find(
      (p) =>
        p.id === q ||
        p.slug === q ||
        p.id.toLowerCase() === qLower ||
        p.slug.toLowerCase() === qLower
    ) || null
  );
}
