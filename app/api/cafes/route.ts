// @ts-nocheck
import { NextResponse } from "next/server";

interface Cafe {
  id: string;
  name: string;
  coordinates: [number, number];
  address: string;
  isSunny: boolean;
  weatherDescription: string;
  temperature: number;
}

// Belgrade center coordinates
const BELGRADE = {
  longitude: 20.4612,
  latitude: 44.8125,
};

// Fetch cafes from Mapbox Search
async function fetchCafesFromMapbox(token: string): Promise<Partial<Cafe>[]> {
  const url = new URL("https://api.mapbox.com/search/searchbox/v1/category/cafe");
  url.searchParams.set("access_token", token);
  url.searchParams.set("language", "en");
  url.searchParams.set("limit", "20");
  url.searchParams.set("longitude", String(BELGRADE.longitude));
  url.searchParams.set("latitude", String(BELGRADE.latitude));
  url.searchParams.set("proximity", `${BELGRADE.longitude},${BELGRADE.latitude}`);
  url.searchParams.set("country", "RS");

  const res = await fetch(url.toString());
  if (!res.ok) {
    const err = await res.text();
    throw new Error(`Mapbox API error ${res.status}: ${err}`);
  }
  const data = await res.json();
  if (!Array.isArray(data.features)) return [];

  return data.features.map((f: any) => ({
    id: f.id,
    name: f.properties.name,
    coordinates: f.geometry.coordinates,
    address:
      f.properties.full_address || f.properties.address || "No address available",
  }));
}

// Fetch real weather data from OpenWeatherMap
type WeatherResult = {
  description: string;
  temperature: number;
  isSunny: boolean;
};
async function fetchWeatherData(
  longitude: number,
  latitude: number
): Promise<WeatherResult> {
  const apiKey = process.env.OPENWEATHER_API_KEY;
  if (!apiKey) {
    throw new Error("Missing OPENWEATHER_API_KEY in environment");
  }
  const weatherUrl = new URL(
    "https://api.openweathermap.org/data/2.5/weather"
  );
  weatherUrl.searchParams.set("lat", String(latitude));
  weatherUrl.searchParams.set("lon", String(longitude));
  weatherUrl.searchParams.set("appid", apiKey);
  weatherUrl.searchParams.set("units", "metric");

  const res = await fetch(weatherUrl.toString());
  if (!res.ok) {
    const err = await res.text();
    throw new Error(`Weather API error ${res.status}: ${err}`);
  }
  const data = await res.json();
  const w = data.weather?.[0] || { main: "", description: "N/A" };
  return {
    description: w.description,
    temperature: data.main?.temp ?? NaN,
    isSunny: w.main.toLowerCase() === "clear",
  };
}

// GET handler
export async function GET(request: Request) {
  const token =
    process.env.MAPBOX_SECRET_TOKEN || process.env.NEXT_PUBLIC_MAPBOX_ACCESS_TOKEN;
  if (!token) {
    return NextResponse.json(
      { error: "Mapbox token not configured" },
      { status: 500 }
    );
  }

  try {
    const cafes = await fetchCafesFromMapbox(token);
    const enriched = await Promise.all(
      cafes.map(async (c) => {
        const [lng, lat] = c.coordinates as [number, number];
        const w = await fetchWeatherData(lng, lat);
        return {
          ...c,
          isSunny: w.isSunny,
          weatherDescription: w.description,
          temperature: w.temperature,
        };
      })
    );
    return NextResponse.json(
      { cafes: enriched },
      {
        status: 200,
        headers: {
          "Cache-Control": "public, max-age=600, stale-while-revalidate=300",
        },
      }
    );
  } catch (error: any) {
    console.error("/api/cafes error:", error);
    return NextResponse.json(
      { error: error.message || "Failed to load cafes" },
      { status: 500 }
    );
  }
} 