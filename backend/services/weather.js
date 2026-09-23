// Free, no-API-key weather lookup via Open-Meteo
const fetchCurrentTemperatureF = async (lat, lon) => {
  const url = `https://api.open-meteo.com/v1/forecast?latitude=${lat}&longitude=${lon}&current=temperature_2m&temperature_unit=fahrenheit`;
  const res = await fetch(url);
  if (!res.ok) {
    throw new Error(`Weather lookup failed with status ${res.status}`);
  }
  const data = await res.json();
  const temperatureF = data?.current?.temperature_2m;
  if (typeof temperatureF !== "number") {
    throw new Error("Weather API returned no temperature");
  }
  return temperatureF;
};

module.exports = { fetchCurrentTemperatureF };
