// app/components/MapClient.tsx
"use client";

import { useEffect, useRef, useState } from "react";
import "leaflet/dist/leaflet.css";
import "leaflet.markercluster/dist/MarkerCluster.css";
import "leaflet.markercluster/dist/MarkerCluster.Default.css";

export type MapPoint = {
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

type Props = {
  points: MapPoint[];
  center?: { lat: number; lng: number };
  zoom?: number;
  className?: string;
  style?: React.CSSProperties;
  fitToPoints?: boolean;
  enableDraw?: boolean; // habilita desenho de polígono
};

/* ===== Helpers p/ formatos (iguais ao .zip) ===== */
function coerceNumAny(x: any): number | undefined {
  if (typeof x === "number" && Number.isFinite(x)) return x;
  if (typeof x === "string") {
    const n = Number(x.trim().replace(/\./g, "").replace(",", ".").replace(/[^0-9.\-]/g, ""));
    return Number.isFinite(n) ? n : undefined;
  }
  return undefined;
}
function readArea(p: any): number | undefined {
  for (const k of ["area_m2", "area", "metragem", "tamanho", "m2"]) {
    const n = coerceNumAny(p?.[k]);
    if (n !== undefined) return n;
  }
  return undefined;
}
function readPrice(p: any): number | undefined {
  for (const k of ["preco", "price", "valor"]) {
    const n = coerceNumAny(p?.[k]);
    if (n !== undefined) return n;
  }
  return undefined;
}
function fmtBRL(n?: number | null): string | null {
  if (n === undefined || n === null) return null;
  if (n === 0) return "SOB CONSULTA";
  if (n === -1) return "VENDIDO";
  try {
    return n.toLocaleString("pt-BR", { style: "currency", currency: "BRL" });
  } catch {
    return String(n);
  }
}

/* ===== Card HTML p/ popup (o mesmo do .zip) ===== */
function popupCardHTML(p: MapPoint) {
  const first = p.fotos?.[0] || "1.jpg";
  const foto = first.startsWith("/") ? first : `/content/properties/${p.id}/fotos/${first}`;

  const areaNum = readArea(p);
  const areaStr = typeof areaNum === "number" ? `${areaNum.toLocaleString("pt-BR")} m²` : "";

  const precoNum = readPrice(p);
  const precoStr = fmtBRL(precoNum);

  const compNum = coerceNumAny((p as any)?.valor_comparativo);
  const compStr = compNum && compNum > 0 ? fmtBRL(compNum) : null;
  const hasDiscount =
    typeof precoNum === "number" && typeof compNum === "number" && compNum > precoNum;

  return `
  <div style="width:280px; border:1px solid #e5e7eb; border-radius:12px; overflow:hidden; background:#fff;">
    <div style="position:relative; aspect-ratio:16/9; background:#f4f4f5;">
      <img src="${foto}" alt="${p.titulo || p.id}" style="width:100%; height:100%; object-fit:cover; display:block;" />
      
      ${precoNum === -1 ? `
        <span style="
          position:absolute;
          top:18px;
          right:-40px;
          background:#dc2626;          /* vermelho principal */
          color:#fff;
          font-weight:700;
          font-size:12px;
          padding:6px 50px;
          transform:rotate(45deg);
          box-shadow:0 2px 6px rgba(0,0,0,.25);
          letter-spacing:.05em;
          text-align:center;
          display:inline-block;
          white-space:nowrap;
        ">VENDIDO</span>
      ` : ""}

      ${hasDiscount ? `
        <span style="
          position:absolute;
          top:8px; left:8px;
          background:#e11d48;
          color:#fff;
          font-size:12px;
          padding:2px 8px;
          border-radius:6px;
        ">Preço baixou</span>
      ` : ""}
    </div>

    <div style="padding:12px;">
      <div style="font-size:11px; letter-spacing:.06em; text-transform:uppercase; color:#6b7280; margin-bottom:4px;">Cód: ${p.id}</div>
      <div style="font-weight:600; line-height:1.25; margin-bottom:4px;">${p.titulo || "Imóvel"}</div>
      ${p.endereco ? `<div style="font-size:12px; color:#4b5563; margin-bottom:4px;">${p.endereco}</div>` : ""}
      ${areaStr ? `<div style="font-size:12px; color:#4b5563; margin-bottom:6px;">${areaStr}</div>` : ""}
      ${compStr && hasDiscount ? `<div style="font-size:12px; color:#9ca3af; text-decoration:line-through; margin-bottom:2px;">${compStr}</div>` : ""}
      
      ${precoStr ? `
        <div style="
          font-size:14px;
          font-weight:600;
          margin-bottom:8px;
          color:${precoStr === "VENDIDO" ? "#dc2626" : "#065f46"};
        ">
          ${precoStr}
        </div>
      ` : ""}
      
      <a href="/imoveis/${p.slug || p.id}" style="display:inline-block; padding:8px 10px; background:#0a454f; color:#fff; border-radius:8px; font-size:12px; text-decoration:none;">Ver anúncio</a>
    </div>
  </div>`;
}


/* ==== Cluster vermelho (bolha) ==== */
function injectClusterStyles() {
  const id = "plink-cluster-styles";
  if (document.getElementById(id)) return;
  const style = document.createElement("style");
  style.id = id;
  style.innerHTML = `
    .marker-cluster { background: transparent; border: 0; }
    .marker-cluster .plink-bubble {
      display:flex; align-items:center; justify-content:center;
      width: 42px; height: 42px; border-radius: 9999px;
      background: #e11d48; /* vermelho 100% */
      color: #fff; font-weight:700; font-size:13px;
      box-shadow: 0 6px 16px rgba(0,0,0,.25), inset 0 0 0 2px rgba(255,255,255,.06);
    }
    .marker-cluster.plink-md .plink-bubble { width: 48px; height: 48px; }
    .marker-cluster.plink-lg .plink-bubble { width: 56px; height: 56px; }
  `;
  document.head.appendChild(style);
}
function clusterIconCreate(Lany: any, cluster: any) {
  const count = cluster.getChildCount();
  const sizeClass = count < 10 ? "plink-sm" : count < 50 ? "plink-md" : "plink-lg";
  return Lany.divIcon({
    html: `<div class="plink-bubble"><span>${count}</span></div>`,
    className: `marker-cluster ${sizeClass}`,
    iconSize: Lany.point(42, 42, true),
  });
}

/* ===== Componente principal (baseado no seu .zip, só adicionando cluster) ===== */
export default function MapClient({
  points,
  center,
  zoom = 12,
  className,
  style,
  fitToPoints,
  enableDraw,

}: Props) {
  const outerRef = useRef<HTMLDivElement>(null);
  const mapHostRef = useRef<HTMLDivElement>(null);

  // refs Leaflet / layers
  const tempLineRef = useRef<any>(null);
  const tempPolyRef = useRef<any>(null);
  const vertexLayerRef = useRef<any>(null);

  const mapRef = useRef<any>(null);
  const clusterGroupRef = useRef<any>(null);

  const [drawState, setDrawState] = useState<{
    mode: "idle" | "drawing" | "done";
    verts: Array<{ lat: number; lng: number }>;
  }>({ mode: "idle", verts: [] });

  // limpa/atualiza overlays ao mudar estado de desenho
  useEffect(() => {
    if (drawState.mode === "idle") {
      try {
        const map = mapRef.current;
        if (!map) return;
        if (tempLineRef.current) { map.removeLayer(tempLineRef.current); tempLineRef.current = null; }
        if (tempPolyRef.current) { map.removeLayer(tempPolyRef.current); tempPolyRef.current = null; }
        if (vertexLayerRef.current) { vertexLayerRef.current.clearLayers(); }
      } catch {}
    } else {
      const map = mapRef.current;
      if (!map) return;
      refreshTempLayers(drawState.verts);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [drawState.mode, drawState.verts]);
  
  useEffect(() => {
    let destroyed = false;

    (async () => {
      try {
        const LeafletMod: any = await import("leaflet");
const L = LeafletMod.default ?? LeafletMod;
(window as any).L = L;

await import("leaflet.markercluster");
        injectClusterStyles();

        // cria mapa
        const map = L.map(mapHostRef.current!, {
          zoomControl: true,
          attributionControl: true,
          dragging: true,
          scrollWheelZoom: true,
          touchZoom: true,
          doubleClickZoom: true,
          boxZoom: true,
          keyboard: true,
          tap: false,
        });
        mapRef.current = map;

        L.tileLayer("https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png", {
          attribution:
            '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>',
          maxZoom: 19,
        }).addTo(map);

        // ÍCONE PNG (public/icons/pin.png e pin@2x.png)
        const ICON_W = 36;
        const ICON_H = 36;
        const propertyIcon = L.icon({
          iconUrl: "/icons/pin.png",
          iconRetinaUrl: "/icons/pin@2x.png",
          iconSize: [ICON_W, ICON_H],
          iconAnchor: [Math.round(ICON_W / 2), ICON_H], // ponta inferior
          popupAnchor: [0, -ICON_H],
        });

        // === CLUSTER vermelho ===
        const clusterGroup = (L as any).markerClusterGroup({
          showCoverageOnHover: false,
          zoomToBoundsOnClick: true,
          spiderfyOnMaxZoom: true,
          removeOutsideVisibleBounds: true,
          maxClusterRadius:50,
          iconCreateFunction: (cluster: any) => clusterIconCreate(L, cluster),
        });
        clusterGroupRef.current = clusterGroup;
        map.addLayer(clusterGroup);

        // Marcadores
        const bounds = L.latLngBounds([]);
        for (const p of points) {
          const ll = L.latLng(p.geo.lat, p.geo.lng);
          bounds.extend(ll);
        
          // Ícone condicional: se o imóvel estiver vendido (preco === -1), muda o ícone
          const isVendido = p.preco === -1 || p.preco === "-1";
          const icon = L.icon({
            iconUrl: isVendido ? "/icons/pin-vendido.png" : "/icons/pin.png",
            iconRetinaUrl: isVendido ? "/icons/pin-vendido@2x.png" : "/icons/pin@2x.png",
            iconSize: [36, 36],
            iconAnchor: [18, 36],
            popupAnchor: [0, -36],
          });
        
          const marker = L.marker(ll, { icon });
          marker.bindPopup(popupCardHTML(p), { maxWidth: 320, className: "leaflet-popup--card" });
        
          clusterGroup.addLayer(marker);
        }
        

        const shouldFit = fitToPoints ?? points.length !== 1;
        if (shouldFit && clusterGroup.getBounds?.().isValid()) {
          map.fitBounds(clusterGroup.getBounds().pad(0.2));
        } else if (points.length === 1) {
          map.setView([points[0].geo.lat, points[0].geo.lng], zoom);
        } else if (center) {
          map.setView([center.lat, center.lng], zoom);
        } else if (bounds.isValid()) {
          map.fitBounds(bounds.pad(0.2));
        }

        // medir largura do zoom para posicionar a toolbar ao lado
        function measureZoomWidth() {
          try {
            const host = outerRef.current as HTMLElement | null;
            const root = mapHostRef.current as HTMLElement | null;
            if (!host || !root) return;
            const zoomEl = root.querySelector(".leaflet-control-zoom") as HTMLElement | null;
            const w = zoomEl ? Math.round(zoomEl.getBoundingClientRect().width) : 0;
            host.style.setProperty("--leaflet-zoom-w", w + "px");
          } catch {}
        }
        setTimeout(measureZoomWidth, 0);
        const rz = new ResizeObserver(() => measureZoomWidth());
        if (mapHostRef.current) rz.observe(mapHostRef.current);
        const zoomEl = mapHostRef.current?.querySelector(".leaflet-control-zoom") as HTMLElement | null;
        if (zoomEl) rz.observe(zoomEl);
        window.addEventListener("resize", measureZoomWidth);

        // camada de vértices + overlays de desenho (iguais ao .zip)
        if (!vertexLayerRef.current) vertexLayerRef.current = L.layerGroup().addTo(map);

        // Recalcular a altura do header e garantir o offset após eventos de popup
        function refreshHeaderOffset() {
          try {
            const headerEl = document.querySelector('header') as HTMLElement | null;
            const h = headerEl ? Math.round(headerEl.getBoundingClientRect().height) : 64;
            document.documentElement.style.setProperty('--header-h', h + 'px');
            window.dispatchEvent(new Event('pl-header-resize'));
            // Revalida o tamanho do mapa após o layout
            setTimeout(() => { try { map.invalidateSize(); } catch {} }, 0);
          } catch {}
        }
        map.on('popupopen', refreshHeaderOffset);
        map.on('popupclose', refreshHeaderOffset);

        function refreshTempLayers(verts: Array<{ lat: number; lng: number }>) {
          // linha tracejada
          if (!tempLineRef.current) {
            tempLineRef.current = L.polyline([], {
              color: "#2563eb",
              weight: 2,
              dashArray: "6 4",
            }).addTo(map);
          }
          tempLineRef.current.setLatLngs(verts.map((v) => L.latLng(v.lat, v.lng)));

          // polígono translucido
          if (verts.length >= 3) {
            if (!tempPolyRef.current) {
              tempPolyRef.current = L.polygon([], {
                color: "#2563eb",
                fillColor: "#3b82f6",
                fillOpacity: 0.1,
              }).addTo(map);
            }
            tempPolyRef.current.setLatLngs([verts.map((v) => L.latLng(v.lat, v.lng))]);
          } else {
            if (tempPolyRef.current) {
              map.removeLayer(tempPolyRef.current);
              tempPolyRef.current = null;
            }
          }

          // vértices como pequenos círculos
          vertexLayerRef.current.clearLayers();
          verts.forEach((v) => {
            L.circleMarker([v.lat, v.lng], {
              radius: 4,
              color: "#2563eb",
              weight: 2,
              fillColor: "#ffffff",
              fillOpacity: 1,
            }).addTo(vertexLayerRef.current);
          });
        }
        // expõe p/ efeito acima
        // @ts-ignore
        window.__refreshTempLayers = refreshTempLayers;

        function onClick(e: any) {
          setDrawState((st) => {
            if (st.mode !== "drawing") return st;
            const verts = [...st.verts, { lat: e.latlng.lat, lng: e.latlng.lng }];
            refreshTempLayers(verts);
            return { ...st, verts };
          });
        }
        function onDblClick() {
          setDrawState((st) => {
            if (st.mode !== "drawing") return st;
            if (st.verts.length < 3) return st;
            refreshTempLayers(st.verts);
            return { mode: "done", verts: st.verts };
          });
        }

        map.on("click", onClick);
        map.on("dblclick", onDblClick);

        // invalidate size on container resize
        const obs = new ResizeObserver(() => {
          try { map && map.invalidateSize(); } catch {}
        });
        if (outerRef.current) obs.observe(outerRef.current);

        // cleanup
        return () => {
          destroyed = true;
          try {
            map && map.remove();
            mapRef.current = null;
            // limpa id interno pro Leaflet poder re-inicializar no mesmo DIV
            const el: any = mapHostRef.current;
            if (el && el._leaflet_id) el._leaflet_id = undefined;
          } catch {}
          obs.disconnect();
          rz.disconnect();
          window.removeEventListener("resize", measureZoomWidth);
          try {
            map.off('popupopen', refreshHeaderOffset);
            map.off('popupclose', refreshHeaderOffset);
          } catch {}
        };
      } catch (err) {
        console.error("Erro inicializando o mapa:", err);
      }
    })();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [JSON.stringify(points), center?.lat, center?.lng, zoom, fitToPoints]);

  function refreshTempLayers(verts: Array<{ lat: number; lng: number }>) {
    // função sobrescrita no init; aqui só pra TS não reclamar
    (window as any).__refreshTempLayers?.(verts);
  }

  // ações da toolbar (iguais ao .zip)
  function startDraw() { setDrawState({ mode: "drawing", verts: [] }); }
  function finishDraw() {
    setDrawState((st) => {
      if (st.mode !== "drawing" || st.verts.length < 3) return st;
      return { ...st, mode: "done" };
    });
  }
  function clearDraw() { setDrawState({ mode: "idle", verts: [] }); }
  function vertsToQuery(verts: Array<{ lat: number; lng: number }>): string {
    return verts.map((v) => `${v.lat.toFixed(6)},${v.lng.toFixed(6)}`).join(";");
  }
  function goToResults() {
    if (drawState.mode !== "done" || drawState.verts.length < 3) return;
    const poly = encodeURIComponent(vertsToQuery(drawState.verts));
    window.location.href = `/?poly=${poly}`;
  }

  return (
    <div ref={outerRef} className={className} style={{ position: "relative", ...(style || {}) }}>
      <div ref={mapHostRef} className="w-full h-full" />

      {(enableDraw ?? points.length > 1) && (
        <div
          className="absolute top-2 z-[2000] flex flex-wrap gap-2 bg-white/90 backdrop-blur rounded-xl border p-2 shadow"
          style={{ left: "calc(var(--leaflet-zoom-w, 0px) + 12px)" }}
        >
          {drawState.mode === "idle" && (
            <button
              onClick={startDraw}
              className="px-3 py-2 rounded-lg bg-[#0a454f] text-white text-sm font-semibold hover:opacity-90"
            >
              Desenhar área
            </button>
          )}

          {drawState.mode === "drawing" && (
            <>
              <button
                onClick={finishDraw}
                className="px-3 py-2 rounded-lg bg-[#0a454f] text-white text-sm font-semibold hover:opacity-90"
              >
                Finalizar
              </button>
              <button onClick={clearDraw} className="px-3 py-2 rounded-lg border text-sm">
                Limpar
              </button>
              <span className="self-center text-xs text-zinc-700">
                Clique no mapa para adicionar vértices • Duplo-clique para fechar
              </span>
            </>
          )}

          {drawState.mode === "done" && (
            <>
              <button
                onClick={goToResults}
                className="px-3 py-2 rounded-lg bg-[#0a454f] text-white text-sm font-semibold hover:opacity-90"
              >
                Ver imóveis na área
              </button>
              <button onClick={clearDraw} className="px-3 py-2 rounded-lg border text-sm">
                Limpar
              </button>
              <span className="self-center text-xs text-zinc-700">Área definida · desenhe novamente para ajustar</span>
            </>
          )}
        </div>
      )}
    </div>
  );
}
