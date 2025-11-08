// Client/src/component/LiveTrackingView.jsx
import React, { useEffect, useRef, useState } from "react";
import { GoogleMap, useJsApiLoader } from "@react-google-maps/api";
import api from "../services/api";
import {
  MAP_CONTAINER_STYLE,
  MAP_OPTIONS,
  LIBRARIES,
  MAP_VERSION,
} from "../config/googleMaps"; // ensure these exports exist

// NOTE: In Vite use import.meta.env to read env vars
const GOOGLE_API_KEY = import.meta.env.VITE_GOOGLE_MAPS_API_KEY;

// A small helper to parse "lat, lng" strings to { lat, lng } objects
const parseLocationString = (loc) => {
  if (!loc || typeof loc !== "string") return { lat: 0, lng: 0 };
  const parts = loc.split(",").map((p) => p.trim());
  if (parts.length !== 2) return { lat: 0, lng: 0 };
  return { lat: parseFloat(parts[0]) || 0, lng: parseFloat(parts[1]) || 0 };
};

// Keep libraries array static (avoid re-creating inline arrays)
const STATIC_LIBRARIES = LIBRARIES && Array.isArray(LIBRARIES) ? LIBRARIES : ["marker"];

const REFRESH_MS = 5000; // how often to poll backend for live data

const LiveTrackingView = ({ emergency, showMap = true }) => {
  const [isLoaded, setIsLoaded] = useState(false);
  const [loadError, setLoadError] = useState(null);

  // Google map & markers refs
  const mapRef = useRef(null);
  const victimMarkerRef = useRef(null);
  const volunteerMarkersRef = useRef({}); // { volunteerId: marker }
  const polylineRef = useRef(null);

  // store latest volunteers data
  const volunteersRef = useRef([]);

  // parse initial center from emergency prop (string "lat,lng")
  const center = React.useMemo(() => {
    if (!emergency) return { lat: 0, lng: 0 };
    const parsed = parseLocationString(emergency.location || emergency?.locationString);
    return parsed;
  }, [emergency]);

  // Load the Google Maps script once using useJsApiLoader
  const { isLoaded: apiIsLoaded, loadError: apiLoadError } = useJsApiLoader({
    id: "google-map-script",
    googleMapsApiKey: GOOGLE_API_KEY,
    libraries: STATIC_LIBRARIES,
    version: MAP_VERSION || "weekly",
  });

  useEffect(() => {
    if (apiLoadError) {
      console.error("Google Maps load error:", apiLoadError);
      setLoadError(apiLoadError);
      return;
    }
    if (apiIsLoaded) setIsLoaded(true);
  }, [apiIsLoaded, apiLoadError]);

  // Create or update the emergency victim marker
  const upsertVictimMarker = (google, position) => {
    if (!google || !mapRef.current) return;
    if (!victimMarkerRef.current) {
      victimMarkerRef.current = new google.maps.Marker({
        position,
        map: mapRef.current,
        title: "Emergency location",
        zIndex: 100,
        optimized: false,
      });
    } else {
      victimMarkerRef.current.setPosition(position);
    }
  };

  // Create or update volunteer markers
  const upsertVolunteerMarker = (google, volunteer) => {
    if (!google || !mapRef.current) return;
    const id = volunteer._id || volunteer.id;
    const pos = volunteer.currentLocation?.coordinates
      ? { lat: volunteer.currentLocation.coordinates[1], lng: volunteer.currentLocation.coordinates[0] }
      : (volunteer.lat && volunteer.lng ? { lat: volunteer.lat, lng: volunteer.lng } : null);

    if (!pos) return;

    const existing = volunteerMarkersRef.current[id];
    if (!existing) {
      const marker = new google.maps.Marker({
        position: pos,
        map: mapRef.current,
        title: volunteer.name || "Volunteer",
        zIndex: 90,
        optimized: false,
      });

      const infoWindow = new google.maps.InfoWindow({
        content: `<div style="min-width:140px"><strong>${volunteer.name || "Volunteer"}</strong><br/>ETA: ${volunteer.eta ?? "N/A"} min<br/>Last: ${volunteer.lastUpdated ? new Date(volunteer.lastUpdated).toLocaleTimeString() : "N/A"}</div>`
      });

      marker.addListener("click", () => infoWindow.open(mapRef.current, marker));
      volunteerMarkersRef.current[id] = marker;
    } else {
      existing.setPosition(pos);
    }
  };

  // Remove markers that are no longer present in the response
  const pruneVolunteerMarkers = (currentVolunteers) => {
    const keepIds = new Set(currentVolunteers.map((v) => v._id || v.id));
    Object.keys(volunteerMarkersRef.current).forEach((id) => {
      if (!keepIds.has(id)) {
        const marker = volunteerMarkersRef.current[id];
        marker.setMap(null);
        delete volunteerMarkersRef.current[id];
      }
    });
  };

  // Optionally draw a polyline from each volunteer to victim (or a single polyline if you want)
  const updatePolylines = (google, volunteers, victimPos) => {
    // For simplicity we'll draw a single polyline joining volunteers to the victim
    // Remove previous polyline
    if (!google) return;
    if (polylineRef.current) {
      polylineRef.current.setMap(null);
      polylineRef.current = null;
    }

    // Build paths: from each volunteer to victim (multiple segments merged)
    const paths = [];
    volunteers.forEach((v) => {
      const coords = v.currentLocation?.coordinates;
      if (coords) {
        paths.push({ lat: coords[1], lng: coords[0] });
        // and then victim
        if (victimPos) paths.push(victimPos);
      }
    });

    if (paths.length > 1) {
      polylineRef.current = new google.maps.Polyline({
        path: paths,
        geodesic: true,
        map: mapRef.current,
        strokeOpacity: 0.6,
        strokeWeight: 2,
      });
    }
  };

  // Fetch live tracking data from backend (emergency id must be available)
  const fetchLiveTracking = async (emergencyId) => {
    if (!emergencyId) return;
    try {
      // primary endpoint - returns volunteers + emergency
      const { data } = await api.get(`/emergencies/${emergencyId}/live-tracking`);
      if (!data || !data.success) return;
      const volunteers = data.volunteers || [];
      const emergencyData = data.emergency || {};

      // store for pruning
      volunteersRef.current = volunteers;

      // Use real google object
      const google = window.google;
      const victimPos = emergencyData.location?.coordinates
        ? { lat: emergencyData.location.coordinates[1], lng: emergencyData.location.coordinates[0] }
        : parseLocationString(emergency?.location);

      upsertVictimMarker(google, victimPos);

      // Upsert volunteers markers
      volunteers.forEach((v) => upsertVolunteerMarker(google, v));
      pruneVolunteerMarkers(volunteers);

      // draw polylines if desired
      updatePolylines(google, volunteers, victimPos);

      // Optionally, adjust map bounds to show victim + volunteers
      try {
        const bounds = new window.google.maps.LatLngBounds();
        if (victimPos && typeof victimPos.lat === "number") bounds.extend(victimPos);
        volunteers.forEach((v) => {
          if (v.currentLocation?.coordinates) {
            bounds.extend({ lat: v.currentLocation.coordinates[1], lng: v.currentLocation.coordinates[0] });
          }
        });
        // Only fit bounds if there are at least two points
        if (!bounds.isEmpty && (volunteers.length > 0)) mapRef.current.fitBounds(bounds, 80);
      } catch (e) {
        // ignore fitBounds errors
      }

    } catch (err) {
      console.error("Failed to fetch live tracking:", err);
    }
  };

  // Periodic polling effect
  useEffect(() => {
    if (!isLoaded || !emergency?._id) return;

    // Immediately fetch once
    fetchLiveTracking(emergency._id);

    const t = setInterval(() => {
      fetchLiveTracking(emergency._id);
    }, REFRESH_MS);

    return () => clearInterval(t);
  }, [isLoaded, emergency?._id]);

  if (loadError) {
    return <div style={{ padding: 12, color: "#ff6b6b" }}>Map error: {String(loadError)}</div>;
  }

  if (!showMap) return null;

  return (
    <div style={{ width: "100%", minHeight: "420px", borderRadius: 12, overflow: "hidden" }}>
      {!isLoaded ? (
        <div style={{ padding: 12 }}>Loading map…</div>
      ) : (
        <GoogleMap
          mapContainerStyle={MAP_CONTAINER_STYLE || { width: "100%", height: "420px" }}
          center={center}
          zoom={15}
          options={MAP_OPTIONS}
          onLoad={(mapInstance) => {
            mapRef.current = mapInstance;
          }}
        />
      )}
    </div>
  );
};

export default LiveTrackingView;
