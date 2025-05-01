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
      style: "mapbox://styles/mapbox/streets-v12",
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
        color: cafe.isSunny ? "#FFD700" : "#808080",
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

  if (loading) return <div>Loading cafés…</div>;
  if (error)
    return (
      <div>
        Error: {error} <button onClick={fetchData}>Retry</button>
      </div>
    );

  const visibleCafes = showSunnyOnly ? cafes.filter((c) => c.isSunny) : cafes;

  return (
    <div className="grid md:grid-cols-2 gap-4">
      <div className="flex flex-wrap gap-2 mb-4">
        <button
          className="px-3 py-1 border rounded"
          onClick={() => setShowSunnyOnly(!showSunnyOnly)}
        >
          {showSunnyOnly ? "Show All" : "Show Sunny Only"}
        </button>
      </div>
      <div
        ref={mapContainer}
        style={{ height: "500px", width: "100%" }}
        className="rounded"
      />
      <div className="overflow-y-auto max-h-[500px] p-2">
        <h2 className="text-xl font-semibold mb-2">Cafés</h2>
        <ul>
          {visibleCafes.map((cafe) => (
            <li
              key={cafe.id}
              className="p-2 mb-2 border rounded cursor-pointer hover:bg-gray-100"
              onClick={() => {
                mapRef.current?.flyTo({
                  center: cafe.coordinates,
                  zoom: 15,
                });
              }}
            >
              <div className="flex justify-between">
                <span className="font-medium">{cafe.name}</span>
                <span>{cafe.isSunny ? "☀️" : "☁️"}</span>
              </div>
              <div className="text-sm">
                {cafe.weatherDescription}, {cafe.temperature}°C
              </div>
              <div className="text-xs text-gray-600">{cafe.address}</div>
            </li>
          ))}
        </ul>
      </div>
    </div>
  );
} 