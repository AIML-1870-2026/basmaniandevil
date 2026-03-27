import type { WeatherData, ForecastDay } from './types';
import {
  toCelsius,
  round1,
  formatTime,
  windDirection,
  titleCase,
  conditionToTheme,
} from './utils';

// ── Theme maps ─────────────────────────────────────────────────────────────────

const THEMES: Record<string, Record<string, string>> = {
  clear: {
    '--bg-primary': '#1a1000',
    '--bg-secondary': '#2e1f00',
    '--accent': '#f5a623',
    '--glow': 'rgba(245,166,35,0.45)',
    '--gradient': 'radial-gradient(ellipse at 60% 20%, #f5a62344 0%, transparent 70%)',
  },
  cloudy: {
    '--bg-primary': '#0e1620',
    '--bg-secondary': '#1a2535',
    '--accent': '#7ba7c9',
    '--glow': 'rgba(123,167,201,0.4)',
    '--gradient': 'radial-gradient(ellipse at 50% 10%, #7ba7c922 0%, transparent 70%)',
  },
  rainy: {
    '--bg-primary': '#051520',
    '--bg-secondary': '#0a2535',
    '--accent': '#3ab5c8',
    '--glow': 'rgba(58,181,200,0.4)',
    '--gradient': 'radial-gradient(ellipse at 40% 0%, #3ab5c830 0%, transparent 70%)',
  },
  snow: {
    '--bg-primary': '#0d1a26',
    '--bg-secondary': '#162233',
    '--accent': '#a8d8f0',
    '--glow': 'rgba(168,216,240,0.4)',
    '--gradient': 'radial-gradient(ellipse at 50% 0%, #a8d8f022 0%, transparent 70%)',
  },
  storm: {
    '--bg-primary': '#0a0612',
    '--bg-secondary': '#15092a',
    '--accent': '#a06cd5',
    '--glow': 'rgba(160,108,213,0.45)',
    '--gradient': 'radial-gradient(ellipse at 50% 0%, #a06cd530 0%, transparent 70%)',
  },
  mist: {
    '--bg-primary': '#111518',
    '--bg-secondary': '#1c2228',
    '--accent': '#8ea4b0',
    '--glow': 'rgba(142,164,176,0.35)',
    '--gradient': 'radial-gradient(ellipse at 50% 20%, #8ea4b020 0%, transparent 70%)',
  },
};

// ── Helpers ────────────────────────────────────────────────────────────────────

function el<T extends HTMLElement>(id: string): T {
  return document.getElementById(id) as T;
}

function iconUrl(code: string): string {
  return `https://openweathermap.org/img/wn/${code}@2x.png`;
}

// ── Theme ──────────────────────────────────────────────────────────────────────

export function applyTheme(conditionId: number): void {
  const theme = conditionToTheme(conditionId);
  const vars = THEMES[theme];
  const root = document.documentElement;
  for (const [key, val] of Object.entries(vars)) {
    root.style.setProperty(key, val);
  }
  // Update gradient overlay
  el('bg-gradient').style.background = vars['--gradient'];
}

// ── Error ──────────────────────────────────────────────────────────────────────

let errorTimer: ReturnType<typeof setTimeout> | null = null;

export function showError(message: string): void {
  const box = el('error-box');
  box.textContent = message;
  box.classList.remove('hidden');
  box.classList.add('visible');

  if (errorTimer) clearTimeout(errorTimer);
  errorTimer = setTimeout(() => dismissError(), 5000);
}

export function dismissError(): void {
  const box = el('error-box');
  box.classList.remove('visible');
  box.classList.add('hidden');
}

// ── Humorous Quips ─────────────────────────────────────────────────────────────

function quipFeelsLike(f: number): string {
  if (f < 0)   return 'colder than your ex\'s heart';
  if (f < 32)  return 'basically a walk-in freezer';
  if (f < 50)  return 'chilly enough to regret not grabbing a jacket';
  if (f < 65)  return 'prime hoodie-and-no-regrets weather';
  if (f < 75)  return 'the sweet spot your thermostat will never find';
  if (f < 86)  return 'warm enough to justify a cold drink';
  if (f < 96)  return 'hotter than your laptop running Chrome';
  if (f < 106) return 'surface-of-the-sun energy';
  return 'your phone will overheat before you do';
}

function quipHumidity(pct: number): string {
  if (pct < 20) return 'drier than a corporate email';
  if (pct < 40) return 'as refreshing as a cracked window';
  if (pct < 60) return 'the air is just… air';
  if (pct < 75) return 'hair frizz advisory in effect';
  if (pct < 86) return 'swimming without the pool';
  if (pct < 96) return 'breathing through a wet towel';
  return 'you are technically underwater';
}

function quipWind(mph: number): string {
  if (mph < 3)  return 'your candle is perfectly safe';
  if (mph < 8)  return 'a gentle reminder that air exists';
  if (mph < 13) return 'enough to make you squint dramatically';
  if (mph < 19) return 'umbrella-flipping territory';
  if (mph < 25) return 'hold onto your hat and your dignity';
  if (mph < 32) return 'nature is telling you to go inside';
  if (mph < 39) return 'your recycling bin is already halfway down the street';
  return 'you are the tumbleweed now';
}

function quipPressure(hpa: number): string {
  if (hpa < 980)  return 'your barometer is having a full meltdown';
  if (hpa < 1000) return 'lower than your motivation on a Monday';
  if (hpa < 1014) return 'textbook atmosphere, nothing to see here';
  if (hpa < 1026) return 'like a small chihuahua sitting on every square inch of you';
  return 'more pressure than a group project deadline';
}

function quipVisibility(km: number): string {
  if (km < 1)  return 'can\'t see your hand in front of your face';
  if (km < 4)  return 'great for avoiding people you know';
  if (km < 9)  return 'your neighbor\'s yard is mercifully hidden';
  if (km < 16) return 'good enough for accidental eye contact';
  return 'so clear you can see your responsibilities from here';
}

function quipSunrise(unix: number): string {
  const hour = new Date(unix * 1000).getHours();
  if (hour < 5)  return 'only the truly unwell are up for this';
  if (hour < 6)  return 'reserved for bakers and bad decisions';
  if (hour < 7)  return 'early enough to feel smug about it';
  return 'a civilized hour your alarm still manages to ruin';
}

function quipSunset(unix: number): string {
  const hour = new Date(unix * 1000).getHours();
  if (hour < 17) return 'the sun clocked out early — relatable';
  if (hour < 18) return 'dark before dinner, winter is not playing';
  if (hour < 20) return 'barely enough evening for one TV episode';
  return 'golden hour for people who actually go outside';
}

// ── Loading ────────────────────────────────────────────────────────────────────

export function showLoading(show: boolean): void {
  el('loading-spinner').classList.toggle('hidden', !show);
  el('weather-section').classList.toggle('hidden', show);
}

// ── Current Weather ────────────────────────────────────────────────────────────

export function renderCurrentWeather(data: WeatherData, isCelsius: boolean): void {
  const temp = isCelsius ? round1(toCelsius(data.temperature)) : round1(data.temperature);
  const feels = isCelsius ? round1(toCelsius(data.feelsLike)) : round1(data.feelsLike);
  const unit = isCelsius ? '°C' : '°F';

  el('city-name').textContent = `${data.city}, ${data.country}`;
  el('temp-value').textContent = `${Math.round(temp)}`;
  el('temp-unit').textContent = unit;
  el('condition-text').textContent = titleCase(data.description);

  const iconEl = el<HTMLImageElement>('condition-icon');
  iconEl.src = iconUrl(data.icon);
  iconEl.alt = data.description;

  el('feels-like').textContent = `${Math.round(feels)}${unit}`;
  el('humidity').textContent = `${data.humidity}%`;
  el('wind').textContent = `${round1(data.windSpeed)} mph ${windDirection(data.windDeg)}`;
  el('pressure').textContent = `${data.pressure} hPa`;
  el('visibility').textContent = `${(data.visibility / 1000).toFixed(1)} km`;
  el('sunrise').textContent = formatTime(data.sunrise);
  el('sunset').textContent = formatTime(data.sunset);

  // Humorous quips (always compare against °F values for consistent thresholds)
  const feelsF = round1(data.feelsLike); // raw value is always °F from API
  el('quip-feels-like').textContent = quipFeelsLike(feelsF);
  el('quip-humidity').textContent = quipHumidity(data.humidity);
  el('quip-wind').textContent = quipWind(data.windSpeed);
  el('quip-pressure').textContent = quipPressure(data.pressure);
  el('quip-visibility').textContent = quipVisibility(data.visibility / 1000);
  el('quip-sunrise').textContent = quipSunrise(data.sunrise);
  el('quip-sunset').textContent = quipSunset(data.sunset);
}

// ── Forecast ──────────────────────────────────────────────────────────────────

export function renderForecast(days: ForecastDay[], isCelsius: boolean): void {
  const container = el('forecast-cards');
  container.innerHTML = '';

  days.forEach((day, i) => {
    const high = isCelsius ? round1(toCelsius(day.high)) : round1(day.high);
    const low = isCelsius ? round1(toCelsius(day.low)) : round1(day.low);
    const unit = isCelsius ? '°C' : '°F';

    const card = document.createElement('div');
    card.className = 'forecast-card';
    card.style.animationDelay = `${0.3 + i * 0.08}s`;
    card.innerHTML = `
      <span class="forecast-day">${day.day}</span>
      <img class="forecast-icon" src="${iconUrl(day.icon)}" alt="${day.description}" />
      <span class="forecast-desc">${titleCase(day.description)}</span>
      <div class="forecast-temps">
        <span class="forecast-high">${Math.round(high)}${unit}</span>
        <span class="forecast-low">${Math.round(low)}${unit}</span>
      </div>
    `;
    container.appendChild(card);
  });
}

// ── Update temperatures only (unit toggle) ────────────────────────────────────

export function updateTemperatureDisplay(
  currentData: WeatherData,
  forecastDays: ForecastDay[],
  isCelsius: boolean
): void {
  renderCurrentWeather(currentData, isCelsius);
  renderForecast(forecastDays, isCelsius);
}
