import { useState } from "react";
import client from "../api/client";

const LOCATION_CACHE_KEY = "fotd_location";
const LOCATION_MAX_AGE_MS = 6 * 60 * 60 * 1000; // 6h — long enough to skip re-prompting within a day, short enough to notice if you've traveled

const getCurrentPosition = () =>
  new Promise((resolve, reject) => {
    if (!navigator.geolocation) {
      reject(new Error("Geolocation is not supported by this browser"));
      return;
    }
    navigator.geolocation.getCurrentPosition(resolve, reject, {
      timeout: 10000,
    });
  });

const getCachedLocation = () => {
  try {
    const raw = localStorage.getItem(LOCATION_CACHE_KEY);
    if (!raw) return null;
    const cached = JSON.parse(raw);
    if (Date.now() - cached.timestamp > LOCATION_MAX_AGE_MS) return null;
    return cached;
  } catch {
    return null;
  }
};

const cacheLocation = (latitude, longitude) => {
  try {
    localStorage.setItem(
      LOCATION_CACHE_KEY,
      JSON.stringify({ latitude, longitude, timestamp: Date.now() }),
    );
  } catch {
    // localStorage might be unavailable (e.g. private browsing) — safe to skip caching
  }
};

// reuse a recent cached location so returning users skip the permission
// prompt + GPS lookup; the weather itself is always fetched fresh
const resolveLocation = async () => {
  const cached = getCachedLocation();
  if (cached) {
    return { latitude: cached.latitude, longitude: cached.longitude };
  }
  const position = await getCurrentPosition();
  const { latitude, longitude } = position.coords;
  cacheLocation(latitude, longitude);
  return { latitude, longitude };
};

export function useOutfits() {
  const [outfits, setOutfits] = useState([]);
  const [season, setSeason] = useState("");
  const [useWeather, setUseWeather] = useState(false);
  const [weatherInfo, setWeatherInfo] = useState(null);
  const [generating, setGenerating] = useState(false);
  const [outfitError, setOutfitError] = useState(null);
  const [hasGenerated, setHasGenerated] = useState(false);

  const generateByWeather = async () => {
    const { latitude, longitude } = await resolveLocation();
    const res = await client.get("/outfits/weather", {
      params: { lat: latitude, lon: longitude },
    });
    if (res.data.error) {
      return { error: res.data.error };
    }
    return { outfits: res.data.outfits, weather: res.data };
  };

  const generateBySeason = async () => {
    const params = season ? { season } : {};
    const res = await client.get("/outfits", { params });
    if (res.data.error) {
      return { error: res.data.error };
    }
    return { outfits: res.data };
  };

  const generateOutfits = async () => {
    setGenerating(true);
    setOutfitError(null);
    setHasGenerated(true);
    setWeatherInfo(null);
    try {
      const result = useWeather
        ? await generateByWeather()
        : await generateBySeason();

      if (result.error) {
        setOutfitError(result.error);
        setOutfits([]);
      } else {
        setOutfits(result.outfits);
        if (result.weather) {
          setWeatherInfo({
            temperatureF: result.weather.temperatureF,
            seasons: result.weather.seasons,
            isRainy: result.weather.isRainy,
            isWindy: result.weather.isWindy,
          });
        }
      }
    } catch (err) {
      console.error("Failed to generate outfits:", err);
      setOutfitError(
        useWeather
          ? "Couldn't get your location or the weather. Please allow location access and try again."
          : "Something went wrong. Please try again.",
      );
    } finally {
      setGenerating(false);
    }
  };

  return {
    outfits,
    season,
    setSeason,
    useWeather,
    setUseWeather,
    weatherInfo,
    generating,
    outfitError,
    hasGenerated,
    generateOutfits,
  };
}
