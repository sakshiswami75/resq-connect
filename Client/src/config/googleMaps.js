// src/config/googleMaps.js
// Centralized Google Maps config used by all components.
// Keep this as a single source of truth to avoid re-creating arrays/objects.

export const LIBRARIES = ["marker"]; // <- used by useJsApiLoader
export const MAP_VERSION = "weekly";
export const MAP_CONTAINER_STYLE = { width: "100%", height: "100%", minHeight: "400px", borderRadius: "12px" };
export const MAP_OPTIONS = {
  mapTypeControl: false,
  streetViewControl: false,
  fullscreenControl: true,
  zoomControl: true,
  // set your custom mapId here if you use one, otherwise remove this line
  // mapId: "YOUR_MAP_ID",
};
