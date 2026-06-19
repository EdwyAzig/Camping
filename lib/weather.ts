import { addDays, toISODate } from "./dates";
import type { Locale } from "@/lib/i18n/config";
import { localeToIntl } from "@/lib/i18n/config";
import { getMessages } from "@/lib/i18n/messages";
import { createTranslator } from "@/lib/i18n/translate";
import type { WeatherForecastDay, WeatherInfo } from "./types";

const WMO_KEYS: Record<number, string> = {
  0: "weather.wmo0",
  1: "weather.wmo1",
  2: "weather.wmo2",
  3: "weather.wmo3",
  45: "weather.wmo45",
  48: "weather.wmo48",
  51: "weather.wmo51",
  53: "weather.wmo53",
  55: "weather.wmo55",
  61: "weather.wmo61",
  63: "weather.wmo63",
  65: "weather.wmo65",
  71: "weather.wmo71",
  80: "weather.wmo80",
  95: "weather.wmo95",
};

function weatherCodeToDescription(code: number, locale: Locale): string {
  const t = createTranslator(getMessages(locale));
  const key = WMO_KEYS[code];
  return key ? t(key) : t("weather.variable");
}

function weatherCodeToIcon(code: number): string {
  if (code === 0) return "☀️";
  if (code <= 3) return "⛅";
  if (code >= 61) return "🌧️";
  return "🌤️";
}

function forecastDayLabel(date: string, today: string, locale: Locale): string {
  const t = createTranslator(getMessages(locale));
  if (date === addDays(today, 1)) return t("weather.tomorrow");
  const d = new Date(`${date}T12:00:00`);
  return new Intl.DateTimeFormat(localeToIntl(locale), { weekday: "short" }).format(d);
}

export async function fetchWeather(
  lat: number,
  lng: number,
  locale: Locale = "it"
): Promise<WeatherInfo | null> {
  try {
    const url =
      `https://api.open-meteo.com/v1/forecast?latitude=${lat}&longitude=${lng}` +
      `&current=temperature_2m,weather_code,wind_speed_10m` +
      `&daily=weather_code,temperature_2m_max,temperature_2m_min` +
      `&forecast_days=7&timezone=auto`;
    const res = await fetch(url, { next: { revalidate: 1800 } });
    if (!res.ok) return null;
    const data = await res.json();
    const code = data.current?.weather_code ?? 0;
    const today = toISODate(new Date());

    const times: string[] = data.daily?.time ?? [];
    const codes: number[] = data.daily?.weather_code ?? [];
    const maxTemps: number[] = data.daily?.temperature_2m_max ?? [];
    const minTemps: number[] = data.daily?.temperature_2m_min ?? [];

    const forecast: WeatherForecastDay[] = times
      .map((date, i) => ({
        date,
        label: forecastDayLabel(date, today, locale),
        tempMax: Math.round(maxTemps[i] ?? 0),
        tempMin: Math.round(minTemps[i] ?? 0),
        icon: weatherCodeToIcon(codes[i] ?? 0),
        description: weatherCodeToDescription(codes[i] ?? 0, locale),
      }))
      .filter((day) => day.date > today)
      .slice(0, 5);

    return {
      temp: Math.round(data.current.temperature_2m),
      description: weatherCodeToDescription(code, locale),
      icon: weatherCodeToIcon(code),
      wind: Math.round(data.current.wind_speed_10m),
      forecast,
    };
  } catch {
    return null;
  }
}
