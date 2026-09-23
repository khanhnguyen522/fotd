import { useState } from "react";
import client from "../api/client";

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

export function useOutfits() {
  const [outfits, setOutfits] = useState([]);
  const [season, setSeason] = useState("");
  const [useWeather, setUseWeather] = useState(false);
  const [weatherInfo, setWeatherInfo] = useState(null);
  const [generating, setGenerating] = useState(false);
  const [outfitError, setOutfitError] = useState(null);
  const [hasGenerated, setHasGenerated] = useState(false);

  const generateByWeather = async () => {
    const position = await getCurrentPosition();
    const { latitude, longitude } = position.coords;
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
