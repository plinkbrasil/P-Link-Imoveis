declare module "leaflet.markercluster";
declare module "leaflet.markercluster/dist/leaflet.markercluster.js";

// Tipos mínimos para satisfazer o TS (opcional, mas útil)
declare namespace L {
  function markerClusterGroup(options?: any): any;
  class MarkerClusterGroup extends LayerGroup {}
}
