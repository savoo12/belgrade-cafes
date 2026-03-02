// CafeMap component
// Provides map visualization, list, loading/error states, sunny filter, geolocation, and basic analytics

"use client";
import React, { useState, useEffect, useRef } from "react";
import mapboxgl, { Map, Marker, Popup } from "mapbox-gl";

interface Cafe {
  id: string;
  name: string;
  coordinates: [number, number];
  address: string;
  isSunny: boolean;
  weatherDescription: string;
  temperature: number;
}

const glassPanel: React.CSSProperties = {
  borderRadius: 22,
  border: "1px solid rgba(255,255,255,0.25)",
  background: "linear-gradient(130deg, rgba(255,255,255,0.22), rgba(255,255,255,0.07))",
  backdropFilter: "blur(22px) saturate(140%)",
  WebkitBackdropFilter: "blur(22px) saturate(140%)",
  boxShadow:
    "0 26px 48px rgba(4, 8, 18, 0.5), inset 0 1px 0 rgba(255,255,255,0.24)",
};

export default function CafeMap() {
  const mapContainer = useRef<HTMLDivElement | null>(null);
  const mapRef = useRef<Map | null>(null);
  const [cafes, setCafes] = useState<Cafe[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [showSunnyOnly, setShowSunnyOnly] = useState(false);

  // Initialize map once
  useEffect(() => {
    if (mapRef.current || !mapContainer.current) return;
    mapboxgl.accessToken = process.env.NEXT_PUBLIC_MAPBOX_ACCESS_TOKEN!;
    const map = new mapboxgl.Map({
      container: mapContainer.current,
      style: "mapbox://styles/mapbox/dark-v11",
      center: [20.4612, 44.8125],
      zoom: 12,
    });
    map.addControl(new mapboxgl.NavigationControl());
    map.addControl(
      new mapboxgl.GeolocateControl({
        positionOptions: { enableHighAccuracy: true },
        trackUserLocation: true,
        showUserHeading: true,
      })
    );

    // Analytics: track map load
    map.on("load", () => console.log("Map loaded"));

    mapRef.current = map;

    // Clean up on unmount to prevent memory leaks
    return () => {
      map.remove();
    };
  }, []);

  // Fetch cafes and weather data
  const fetchData = () => {
    setLoading(true);
    setError(null);
    fetch("/api/cafes")
      .then((res) => {
        if (!res.ok) throw new Error(`Error ${res.status}`);
        return res.json();
      })
      .then((data) => setCafes(data.cafes || []))
      .catch((err) => setError(err.message || "Failed to load data."))
      .finally(() => setLoading(false));
  };

  useEffect(() => {
    fetchData();
  }, []);

  // Update markers when cafes or filter changes
  useEffect(() => {
    const map = mapRef.current;
    if (!map) return;

    // Clear existing markers
    document.querySelectorAll(".mapboxgl-marker").forEach((m) => m.remove());

    const filtered = showSunnyOnly ? cafes.filter((c) => c.isSunny) : cafes;

    filtered.forEach((cafe) => {
      const popup = new Popup().setHTML(
        `<strong>${cafe.name}</strong><br/>
        ${cafe.weatherDescription} - ${cafe.temperature}°C<br/>
        ${cafe.address}`
      );
      const marker = new Marker({
        color: cafe.isSunny ? "#ffe082" : "#8ea3c4",
      })
        .setLngLat(cafe.coordinates)
        .setPopup(popup)
        .addTo(map);

      // Analytics: track marker click
      marker.getElement().addEventListener("click", () => {
        console.log(`Marker clicked: ${cafe.name}`);
      });
    });
  }, [cafes, showSunnyOnly]);

  if (loading)
    return (
      <div style={{ ...glassPanel, padding: 20 }}>
        Loading cafés…
      </div>
    );
  if (error)
    return (
      <div style={{ ...glassPanel, padding: 20 }}>
        Error: {error}{" "}
        <button onClick={fetchData} style={{ marginLeft: 8 }}>
          Retry
        </button>
      </div>
    );

  const visibleCafes = showSunnyOnly ? cafes.filter((c) => c.isSunny) : cafes;

  return (
    <div style={{ display: "grid", gap: 14 }}>
      <div style={{ ...glassPanel, padding: 12, display: "flex", gap: 10 }}>
        <button
          style={{
            border: "1px solid rgba(255,255,255,0.34)",
            borderRadius: 999,
            background: "rgba(190, 226, 255, 0.16)",
            color: "#ffffff",
            padding: "8px 14px",
            fontWeight: 600,
            cursor: "pointer",
          }}
          onClick={() => setShowSunnyOnly(!showSunnyOnly)}
        >
          {showSunnyOnly ? "Show All" : "Show Sunny Only"}
        </button>
      </div>

      <div
        style={{
          display: "grid",
          gridTemplateColumns: "minmax(0, 1.5fr) minmax(280px, 1fr)",
          gap: 14,
        }}
      >
        <div
          style={{
            ...glassPanel,
            padding: 6,
            minHeight: 520,
          }}
        >
          <div
            ref={mapContainer}
            style={{ height: "100%", width: "100%", borderRadius: 16, overflow: "hidden" }}
          />
        </div>

        <div style={{ ...glassPanel, overflow: "hidden" }}>
          <div style={{ padding: "14px 14px 6px", fontSize: 22, fontWeight: 700 }}>
            Cafés
          </div>
          <ul
            style={{
              listStyle: "none",
              margin: 0,
              padding: "8px 12px 12px",
              maxHeight: 500,
              overflowY: "auto",
            }}
          >
            {visibleCafes.map((cafe) => (
              <li
                key={cafe.id}
                style={{
                  padding: 12,
                  marginBottom: 10,
                  border: "1px solid rgba(255,255,255,0.2)",
                  borderRadius: 14,
                  background: "rgba(255,255,255,0.08)",
                  cursor: "pointer",
                }}
                onClick={() => {
                  mapRef.current?.flyTo({
                    center: cafe.coordinates,
                    zoom: 15,
                  });
                }}
              >
                <div
                  style={{
                    display: "flex",
                    justifyContent: "space-between",
                    fontWeight: 600,
                  }}
                >
                  <span>{cafe.name}</span>
                  <span>{cafe.isSunny ? "☀️" : "☁️"}</span>
                </div>
                <div style={{ fontSize: 14, opacity: 0.9 }}>
                  {cafe.weatherDescription}, {cafe.temperature}°C
                </div>
                <div style={{ fontSize: 12, opacity: 0.75 }}>{cafe.address}</div>
              </li>
            ))}
          </ul>
        </div>
      </div>
    </div>
  );
}
