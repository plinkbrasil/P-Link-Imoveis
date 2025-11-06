// Tipos “buraco negro” só pra satisfazer o TS no build
declare module "leaflet.markercluster";
declare module "leaflet.markercluster/dist/leaflet.markercluster.js";

// (Opcional) se quiser acessar L.markerClusterGroup sem erro de tipo:
declare namespace L {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  function markerClusterGroup(options?: any): any;
}
