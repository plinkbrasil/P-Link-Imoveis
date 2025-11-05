// -*- lib/geo.ts -*-
/**
 * Converte coordenadas em vários formatos para número:
 * - número (decimal) → retorna direto
 * - string decimal com vírgula/ponto → normaliza
 * - DMS: 25°42'12.42\"S, 49°16'23.10\"W, ... (também aceita 'O' (Oeste) e 'L' (Leste))
 * Retorna undefined se não conseguir converter.
 */
export function parseDMS(input: unknown): number | undefined {
  if (input == null) return undefined;

  if (typeof input === "number" && Number.isFinite(input)) {
    return input;
  }

  const raw = String(input).trim();
  if (!raw) return undefined;

  // Normalizações
  const normalized = raw
    .replace(/[’′]/g, "'")
    .replace(/[”″]/g, '"')
    .replace(/\s+/g, " ")
    .replace(/,/g, "."); // pt-BR decimal

  // Detecta hemisfério (em qualquer posição)
  // N/S/E/W + Português: O (Oeste) = West; L (Leste) = East
  let sign = 1;
  const hemiMatch = normalized.match(/[NSEWOL]/i);
  if (hemiMatch) {
    const h = hemiMatch[0].toUpperCase();
    if (h === "S" || h === "W" || h === "O") sign = -1;
    if (h === "N" || h === "E" || h === "L") sign = 1;
  }
  // Se a string começar com '-', força negativo
  if (/^-/.test(normalized)) sign = -1;

  // DMS?
  if (/[°]/.test(normalized)) {
    const dMatch = normalized.match(/(-?\d+(?:\.\d+)?)\s*°/);
    const mMatch = normalized.match(/(\d+(?:\.\d+)?)\s*['']/);
    const sMatch = normalized.match(/(\d+(?:\.\d+)?)\s*[""]/);

    const d = dMatch ? parseFloat(dMatch[1]) : NaN;
    const m = mMatch ? parseFloat(mMatch[1]) : 0;
    const s = sMatch ? parseFloat(sMatch[1]) : 0;

    if (!Number.isFinite(d) || !Number.isFinite(m) || !Number.isFinite(s)) return undefined;

    const abs = Math.abs(d) + m / 60 + s / 3600;
    return sign * abs;
  }

  // Decimal simples
  const decMatch = normalized.match(/-?\d+(?:\.\d+)?/);
  if (decMatch) {
    const n = parseFloat(decMatch[0]);
    if (Number.isFinite(n)) {
      const v = Math.abs(n) * (sign >= 0 ? 1 : -1);
      return v;
    }
  }

  return undefined;
}

export function normalizeLatLng(geo: any): { lat: number; lng: number } | null {
  if (!geo) return null;
  const lat = parseDMS(geo.lat ?? geo.latitude);
  const lng = parseDMS(geo.lng ?? geo.lon ?? geo.long ?? geo.longitude);
  if (typeof lat === "number" && typeof lng === "number" && Number.isFinite(lat) && Number.isFinite(lng)) {
    if (lat < -90 || lat > 90 || lng < -180 || lng > 180) return null;
    return { lat, lng };
  }
  return null;
}
