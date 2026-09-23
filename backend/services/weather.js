// Free, no-API-key weather lookup via Open-Meteo
const fetchCurrentWeather = async (lat, lon) => {
  const url =
    `https://api.open-meteo.com/v1/forecast?latitude=${lat}&longitude=${lon}` +
    `&current=temperature_2m,precipitation,wind_speed_10m` +
    `&temperature_unit=fahrenheit&wind_speed_unit=mph`;
  const res = await fetch(url);
  if (!res.ok) {
    throw new Error(`Weather lookup failed with status ${res.status}`);
  }
  const data = await res.json();
  const current = data?.current;
  if (!current || typeof current.temperature_2m !== "number") {
    throw new Error("Weather API returned no current conditions");
  }
  return {
    temperatureF: current.temperature_2m,
    precipitationMm: current.precipitation ?? 0,
    windSpeedMph: current.wind_speed_10m ?? 0,
  };
};

module.exports = { fetchCurrentWeather };
