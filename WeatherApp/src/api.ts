import type {
  WeatherData,
  ForecastDay,
  OpenWeatherCurrentResponse,
  OpenWeatherForecastResponse,
  OpenWeatherForecastItem,
} from './types';
import { getDayName } from './utils';

const API_KEY = '2d95846d49911932de92461f7d0645c5';
const BASE = 'https://api.openweathermap.org/data/2.5';

export class WeatherApiError extends Error {
  constructor(
    message: string,
    public statusCode?: number
  ) {
    super(message);
    this.name = 'WeatherApiError';
  }
}

export async function fetchCurrentWeather(city: string): Promise<WeatherData> {
  const url = `${BASE}/weather?q=${encodeURIComponent(city)}&appid=${API_KEY}&units=imperial`;
  const res = await fetch(url);
  const data: OpenWeatherCurrentResponse = await res.json();

  if (!res.ok) {
    if (res.status === 404) throw new WeatherApiError('City not found. Please try another name.', 404);
    throw new WeatherApiError(data.message ?? 'Failed to fetch weather data.', res.status);
  }

  return {
    city: data.name,
    country: data.sys.country,
    temperature: data.main.temp,
    feelsLike: data.main.feels_like,
    humidity: data.main.humidity,
    pressure: data.main.pressure,
    windSpeed: data.wind.speed,
    windDeg: data.wind.deg,
    visibility: data.visibility,
    description: data.weather[0].description,
    icon: data.weather[0].icon,
    sunrise: data.sys.sunrise,
    sunset: data.sys.sunset,
    conditionId: data.weather[0].id,
  };
}

export async function fetchForecast(city: string): Promise<ForecastDay[]> {
  const url = `${BASE}/forecast?q=${encodeURIComponent(city)}&appid=${API_KEY}&units=imperial`;
  const res = await fetch(url);
  const data: OpenWeatherForecastResponse = await res.json();

  if (!res.ok) {
    throw new WeatherApiError(
      typeof data.message === 'string' ? data.message : 'Failed to fetch forecast.',
      res.status
    );
  }

  // Group forecast items by day (skip today)
  const today = new Date().toDateString();
  const byDay = new Map<string, OpenWeatherForecastItem[]>();

  for (const item of data.list) {
    const date = new Date(item.dt * 1000);
    const key = date.toDateString();
    if (key === today) continue;
    if (!byDay.has(key)) byDay.set(key, []);
    byDay.get(key)!.push(item);
  }

  const days: ForecastDay[] = [];

  for (const [, items] of byDay) {
    if (days.length >= 5) break;
    const highs = items.map((i) => i.main.temp_max);
    const lows = items.map((i) => i.main.temp_min);
    // Most frequent icon/description (use noon slot if available, else first)
    const noon = items.find((i) => {
      const h = new Date(i.dt * 1000).getHours();
      return h >= 11 && h <= 13;
    }) ?? items[Math.floor(items.length / 2)];

    days.push({
      day: getDayName(items[0].dt),
      high: Math.max(...highs),
      low: Math.min(...lows),
      description: noon.weather[0].description,
      icon: noon.weather[0].icon,
    });
  }

  return days;
}
