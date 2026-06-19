import type { WeatherInfo } from "./types";

const WMO: Record<number, string> = {
  0: "Sereno",
  1: "Prevalentemente sereno",
  2: "Parzialmente nuvoloso",
  3: "Nuvoloso",
  45: "Nebbia",
  48: "Nebbia gelata",
  51: "Pioggerella",
  53: "Pioggerella moderata",
  55: "Pioggerella intensa",
  61: "Pioggia leggera",
  63: "Pioggia moderata",
  65: "Pioggia forte",
  71: "Neve leggera",
  80: "Rovesci",
  95: "Temporale",
};

export async function fetchWeather(lat: number, lng: number): Promise<WeatherInfo | null> {
  try {
    const url = `https://api.open-meteo.com/v1/forecast?latitude=${lat}&longitude=${lng}&current=temperature_2m,weather_code,wind_speed_10m&timezone=auto`;
    const res = await fetch(url, { next: { revalidate: 1800 } });
    if (!res.ok) return null;
    const data = await res.json();
    const code = data.current?.weather_code ?? 0;
    return {
      temp: Math.round(data.current.temperature_2m),
      description: WMO[code] ?? "Variabile",
      icon: code === 0 ? "☀️" : code <= 3 ? "⛅" : code >= 61 ? "🌧️" : "🌤️",
      wind: Math.round(data.current.wind_speed_10m),
    };
  } catch {
    return null;
  }
}
