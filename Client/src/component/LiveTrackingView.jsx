// src/component/LiveTrackingView.jsx
import React, { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { GoogleMap, useJsApiLoader } from "@react-google-maps/api";
import api from "../services/api";
import { LIBRARIES, MAP_VERSION } from "../config/googleMaps";

// Module-scope constants
const MAP_CONTAINER_STYLE = { width: "100%", height: "100%", minHeight: "400px", borderRadius: "12px" };
const MAP_OPTIONS = {
  mapTypeControl: false,
  streetViewControl: false,
  fullscreenControl: true,
  zoomControl: true,
  mapId: "YOUR_MAP_ID",
};
const POLL_INTERVAL_MS = 5000;
const MAX_TRAIL_POINTS = 20; // keep the last N points for each volunteer

// Helpers
const coordsFromGeoJSON = (geo) => {
  if (!geo || !Array.isArray(geo.coordinates) || geo.coordinates.length < 2) return null;
  const [lng, lat] = geo.coordinates;
  return { lat: parseFloat(lat), lng: parseFloat(lng) };
};

const LiveTrackingView = ({ emergency }) => {
  const googleMapsApiKey = import.meta.env.VITE_GOOGLE_MAPS_API_KEY || "";

  // use the shared LIBRARIES constant — prevents unintentional reload warnings
  const { isLoaded, loadError } = useJsApiLoader({
    id: "google-map-script",
    googleMapsApiKey,
    libraries: LIBRARIES,
    version: MAP_VERSION,
  });

  const emergencyLocation = useMemo(() => {
    if (!emergency) return { lat: 0, lng: 0 };
    if (typeof emergency.location === "string") {
      const parts = emergency.location.split(",");
      return { lat: parseFloat(parts[0]), lng: parseFloat(parts[1]) };
    }
    if (emergency.location?.coordinates) {
      const [lng, lat] = emergency.location.coordinates;
      return { lat: parseFloat(lat), lng: parseFloat(lng) };
    }
    return { lat: 0, lng: 0 };
  }, [emergency]);

  const mapRef = useRef(null);
  const emergencyMarkerRef = useRef(null);

  // volunteerDataRef: Map<volId, { marker, trailPolyline, toEmergencyLine, path:Array<LatLng>, lastUpdated }>
  const volunteerDataRef = useRef(new Map());
  const pollTimerRef = useRef(null);
  const isPollingRef = useRef(false); // guard to avoid overlapping polls
  const [lastFetchError, setLastFetchError] = useState(null);

  const onLoad = useCallback((mapInstance) => {
    mapRef.current = mapInstance;
  }, []);

  // Utility: create marker (Advanced if available) and wire click -> InfoWindow
  const createMarker = (pos, vol) => {
    if (!window.google?.maps || !mapRef.current) return null;
    const gm = window.google.maps;

    try {
      if (gm.marker && typeof gm.marker.AdvancedMarkerElement === "function") {
        const content = document.createElement("div");
        content.style.display = "flex";
        content.style.alignItems = "center";
        content.style.justifyContent = "center";
        content.style.width = "36px";
        content.style.height = "36px";
        content.style.borderRadius = "50%";
        content.style.boxShadow = "0 1px 4px rgba(0,0,0,0.4)";
        content.style.background = "#1976d2";
        content.style.color = "white";
        content.style.fontWeight = "600";
        content.style.fontSize = "12px";
        content.style.userSelect = "none";
        content.textContent = vol.name ? (vol.name[0] || "V").toUpperCase() : "V";

        const marker = new gm.marker.AdvancedMarkerElement({
          position: pos,
          map: mapRef.current,
          content,
          title: vol.name || `Volunteer ${vol._id || ''}`,
        });

        marker.addListener?.("click", () => {
          const info = new gm.InfoWindow({
            content: `<div style="min-width:160px"><strong>${vol.name || 'Volunteer'}</strong><div>ETA: ${vol.eta ?? '—'} min</div><div>Last: ${vol.lastUpdated ? new Date(vol.lastUpdated).toLocaleTimeString() : '—'}</div></div>`
          });
          info.open(mapRef.current, marker);
          setTimeout(() => info.close(), 6000);
        });

        return marker;
      } else {
        const label = vol.name ? vol.name[0].toUpperCase() : "V";
        const marker = new gm.Marker({
          position: pos,
          map: mapRef.current,
          title: vol.name || `Volunteer ${vol._id || ''}`,
          label: { text: label, color: "white", fontWeight: "600" },
        });

        marker.addListener?.("click", () => {
          const info = new gm.InfoWindow({
            content: `<div style="min-width:160px"><strong>${vol.name || 'Volunteer'}</strong><div>ETA: ${vol.eta ?? '—'} min</div><div>Last: ${vol.lastUpdated ? new Date(vol.lastUpdated).toLocaleTimeString() : '—'}</div></div>`
          });
          info.open(mapRef.current, marker);
          setTimeout(() => info.close(), 6000);
        });

        return marker;
      }
    } catch (e) {
      console.warn("createMarker error:", e);
      return null;
    }
  };

  // Create a polyline for trail and a line to emergency
  const createTrailPolyline = (color = "#2196f3") => {
    const gm = window.google?.maps;
    if (!gm || !mapRef.current) return null;
    return new gm.Polyline({
      map: mapRef.current,
      path: [],
      geodesic: true,
      strokeColor: color,
      strokeOpacity: 0.7,
      strokeWeight: 3,
    });
  };

  const createDirectLine = (color = "#ff8a65") => {
    const gm = window.google?.maps;
    if (!gm || !mapRef.current) return null;
    return new gm.Polyline({
      map: mapRef.current,
      path: [],
      geodesic: true,
      strokeColor: color,
      strokeOpacity: 0.8,
      strokeWeight: 2,
    });
  };

  // Place/update emergency marker
  useEffect(() => {
    if (!isLoaded || !mapRef.current) return;
    const gm = window.google?.maps;
    const map = mapRef.current;
    if (!gm) return;

    // clear previous emergency marker
    if (emergencyMarkerRef.current) {
      try { if (emergencyMarkerRef.current.setMap) emergencyMarkerRef.current.setMap(null); } catch (e) {}
      emergencyMarkerRef.current = null;
    }

    try {
      if (gm.marker && typeof gm.marker.AdvancedMarkerElement === "function") {
        const content = document.createElement("div");
        content.style.width = "44px";
        content.style.height = "44px";
        content.style.borderRadius = "50%";
        content.style.background = "#d32f2f";
        content.style.display = "flex";
        content.style.alignItems = "center";
        content.style.justifyContent = "center";
        content.style.color = "white";
        content.style.fontWeight = "700";
        content.textContent = "E";

        const adv = new gm.marker.AdvancedMarkerElement({
          position: emergencyLocation,
          map,
          title: "Emergency Location",
          content,
        });
        emergencyMarkerRef.current = adv;
      } else {
        const marker = new gm.Marker({
          position: emergencyLocation,
          map,
          title: "Emergency Location",
        });
        emergencyMarkerRef.current = marker;
      }

      // center/zoom initially
      try {
        map.panTo(emergencyLocation);
        map.setZoom(15);
      } catch (e) {}
    } catch (e) {
      console.warn("Failed to create emergency marker:", e);
    }
  }, [isLoaded, emergencyLocation]);

  // Upsert volunteer: update marker, append to trail, update direct line
  const upsertVolunteer = (vol) => {
    if (!window.google?.maps || !mapRef.current) return;
    const vid = vol._id || vol.id;
    const newPos = coordsFromGeoJSON(vol.currentLocation) || (vol.latitude && vol.longitude ? { lat: parseFloat(vol.latitude), lng: parseFloat(vol.longitude) } : null);
    if (!newPos) return;

    const data = volunteerDataRef.current;
    let entry = data.get(vid);

    if (!entry) {
      // create new entry
      const marker = createMarker(newPos, vol);
      const trail = createTrailPolyline('#2196f3');
      const direct = createDirectLine('#ff8a65');
      const path = [newPos];
      trail.setPath(path);
      direct.setPath([newPos, emergencyLocation]);
      entry = { marker, trailPolyline: trail, toEmergencyLine: direct, path, lastUpdated: vol.lastUpdated || null };
      data.set(vid, entry);
      return;
    }

    // update marker position
    try {
      if (entry.marker) {
        if (entry.marker.setPosition) entry.marker.setPosition(newPos);
        else if (entry.marker.position) entry.marker.position = newPos;
      }
    } catch (e) {}

    // append to path (maintain max length)
    entry.path = entry.path || [];
    const last = entry.path[entry.path.length - 1];
    const sameAsLast = last && last.lat === newPos.lat && last.lng === newPos.lng;
    if (!sameAsLast) {
      entry.path.push(newPos);
      if (entry.path.length > MAX_TRAIL_POINTS) entry.path.shift();
      try { if (entry.trailPolyline) entry.trailPolyline.setPath(entry.path); } catch (e) {}
    }

    // update direct-to-emergency line
    try {
      if (entry.toEmergencyLine) {
        entry.toEmergencyLine.setPath([newPos, emergencyLocation]);
      }
    } catch (e) {}

    entry.lastUpdated = vol.lastUpdated || entry.lastUpdated;
    data.set(vid, entry);
  };

  // Remove volunteer not seen this round
  const removeVolunteer = (vid) => {
    const data = volunteerDataRef.current;
    const entry = data.get(vid);
    if (!entry) return;
    try { if (entry.marker.setMap) entry.marker.setMap(null); } catch (e) {}
    try { if (entry.trailPolyline) entry.trailPolyline.setMap(null); } catch (e) {}
    try { if (entry.toEmergencyLine) entry.toEmergencyLine.setMap(null); } catch (e) {}
    data.delete(vid);
  };

  // Fetch volunteer positions (controller endpoints: live-tracking or responding-volunteers)
  const fetchVolunteerPositions = useCallback(async () => {
    if (!emergency?.id) return;
    if (isPollingRef.current) return; // skip overlapping calls
    isPollingRef.current = true;
    setLastFetchError(null);

    const primary = `/emergencies/${emergency.id}/live-tracking`;
    const fallback = `/emergencies/${emergency.id}/responding-volunteers`;

    try {
      let resp;
      try {
        resp = await api.get(primary);
      } catch (errPrimary) {
        if (errPrimary?.response?.status === 404) {
          resp = await api.get(fallback);
        } else {
          throw errPrimary;
        }
      }

      const payload = resp.data;
      let list = [];
      if (Array.isArray(payload)) list = payload;
      else if (Array.isArray(payload.volunteers)) list = payload.volunteers;
      else if (Array.isArray(payload.data)) list = payload.data;
      else if (Array.isArray(payload.volunteersWithTracking)) list = payload.volunteersWithTracking;
      else list = [];

      // seen set
      const seen = new Set();

      list.forEach((vol) => {
        const vid = vol._id || vol.id;
        if (!vid) return;
        seen.add(vid);
        upsertVolunteer(vol);
      });

      // remove stale markers
      for (const vid of Array.from(volunteerDataRef.current.keys())) {
        if (!seen.has(vid)) removeVolunteer(vid);
      }

      // fit bounds to include emergency + volunteers (if any)
      try {
        const gm = window.google?.maps;
        if (gm && mapRef.current) {
          const bounds = new gm.LatLngBounds();
          bounds.extend(new gm.LatLng(emergencyLocation.lat, emergencyLocation.lng));
          for (const entry of volunteerDataRef.current.values()) {
            const marker = entry.marker;
            const pos = marker?.getPosition ? marker.getPosition() : (marker?.position ? marker.position : null);
            if (pos) bounds.extend(pos);
          }
          if (!bounds.isEmpty && typeof mapRef.current.fitBounds === "function") {
            mapRef.current.fitBounds(bounds, 80);
          }
        }
      } catch (e) {}

      setLastFetchError(null);
    } catch (err) {
      console.warn("Failed to fetch live tracking:", err);
      setLastFetchError(err?.response?.data?.message || err.message || "Fetch error");
    } finally {
      isPollingRef.current = false;
    }
  }, [emergency?.id, emergencyLocation]);

  // Start polling / stop cleanup
  useEffect(() => {
    if (!isLoaded || !emergency?.id) return;

    // initial run
    fetchVolunteerPositions();

    // set interval
    pollTimerRef.current = setInterval(fetchVolunteerPositions, POLL_INTERVAL_MS);

    return () => {
      if (pollTimerRef.current) {
        clearInterval(pollTimerRef.current);
        pollTimerRef.current = null;
      }

      // cleanup all volunteer overlays
      for (const [vid, entry] of volunteerDataRef.current.entries()) {
        try { if (entry.marker && entry.marker.setMap) entry.marker.setMap(null); } catch (e) {}
        try { if (entry.trailPolyline) entry.trailPolyline.setMap(null); } catch (e) {}
        try { if (entry.toEmergencyLine) entry.toEmergencyLine.setMap(null); } catch (e) {}
      }
      volunteerDataRef.current.clear();
    };
  }, [isLoaded, emergency?.id, fetchVolunteerPositions]);

  // full unmount cleanup
  useEffect(() => {
    return () => {
      if (pollTimerRef.current) {
        clearInterval(pollTimerRef.current);
        pollTimerRef.current = null;
      }
      if (emergencyMarkerRef.current) {
        try { if (emergencyMarkerRef.current.setMap) emergencyMarkerRef.current.setMap(null); } catch (e) {}
        emergencyMarkerRef.current = null;
      }
      for (const entry of volunteerDataRef.current.values()) {
        try { if (entry.marker && entry.marker.setMap) entry.marker.setMap(null); } catch (e) {}
        try { if (entry.trailPolyline) entry.trailPolyline.setMap(null); } catch (e) {}
        try { if (entry.toEmergencyLine) entry.toEmergencyLine.setMap(null); } catch (e) {}
      }
      volunteerDataRef.current.clear();
    };
  }, []);

  if (loadError) {
    return <div style={{ padding: 12, color: "#ff6b6b" }}>Map load error. Check API key and network.</div>;
  }
  if (!isLoaded) {
    return <div style={{ padding: 12 }}>Loading map...</div>;
  }

  return (
    <div style={{ width: "100%", height: "100%", position: "relative" }}>
      <GoogleMap
        mapContainerStyle={MAP_CONTAINER_STYLE}
        center={emergencyLocation}
        zoom={15}
        options={MAP_OPTIONS}
        onLoad={onLoad}
      >
        {/* rendering done imperatively */}
      </GoogleMap>

      {lastFetchError && (
        <div style={{
          position: "absolute",
          right: 12,
          bottom: 12,
          zIndex: 9999,
          background: "rgba(0,0,0,0.6)",
          color: "white",
          padding: "6px 10px",
          borderRadius: 6
        }}>
          Volunteer fetch error
        </div>
      )}
    </div>
  );
};

export default LiveTrackingView;
