export interface WeatherData {
  city: string;
  country: string;
  temperature: number;
  feelsLike: number;
  humidity: number;
  pressure: number;
  windSpeed: number;
  windDeg: number;
  visibility: number;
  description: string;
  icon: string;
  sunrise: number;
  sunset: number;
  conditionId: number;
}

export interface ForecastDay {
  day: string;
  high: number;
  low: number;
  description: string;
  icon: string;
}

export interface OpenWeatherCurrentResponse {
  name: string;
  sys: { country: string; sunrise: number; sunset: number };
  main: {
    temp: number;
    feels_like: number;
    humidity: number;
    pressure: number;
  };
  wind: { speed: number; deg: number };
  visibility: number;
  weather: { id: number; description: string; icon: string }[];
  cod: number | string;
  message?: string;
}

export interface OpenWeatherForecastItem {
  dt: number;
  main: { temp_max: number; temp_min: number };
  weather: { description: string; icon: string }[];
}

export interface OpenWeatherForecastResponse {
  list: OpenWeatherForecastItem[];
  cod: string;
  message?: string | number;
}

export type Units = 'imperial' | 'metric';
