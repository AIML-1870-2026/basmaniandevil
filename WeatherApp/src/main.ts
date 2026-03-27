import '../styles/styles.css';
import { fetchCurrentWeather, fetchForecast, WeatherApiError } from './api';
import {
  applyTheme,
  renderCurrentWeather,
  renderForecast,
  showError,
  dismissError,
  showLoading,
} from './ui';
import type { WeatherData, ForecastDay } from './types';

// ── State ──────────────────────────────────────────────────────────────────────

let currentData: WeatherData | null = null;
let forecastDays: ForecastDay[] = [];
let isCelsius = false;

// ── DOM references ─────────────────────────────────────────────────────────────

const searchInput = document.getElementById('search-input') as HTMLInputElement;
const searchBtn = document.getElementById('search-btn') as HTMLButtonElement;
const unitToggle = document.getElementById('unit-toggle') as HTMLButtonElement;
const errorBox = document.getElementById('error-box') as HTMLDivElement;

// ── Search ─────────────────────────────────────────────────────────────────────

async function handleSearch(): Promise<void> {
  const city = searchInput.value.trim();

  if (!city) {
    showError('Please enter a city name.');
    return;
  }

  dismissError();
  showLoading(true);

  try {
    const [weather, forecast] = await Promise.all([
      fetchCurrentWeather(city),
      fetchForecast(city),
    ]);

    currentData = weather;
    forecastDays = forecast;

    applyTheme(weather.conditionId);
    renderCurrentWeather(weather, isCelsius);
    renderForecast(forecast, isCelsius);

    // Hide welcome screen on first successful search
    const welcome = document.getElementById('welcome-section');
    if (welcome) welcome.classList.add('hidden');

    showLoading(false);

    // Trigger staggered fade-in
    const section = document.getElementById('weather-section')!;
    section.classList.remove('hidden');
    // Force reflow so animation plays on re-search
    void section.offsetHeight;
    section.classList.add('fade-in');
  } catch (err) {
    showLoading(false);
    if (err instanceof WeatherApiError) {
      showError(err.message);
    } else {
      showError('Network error. Please check your connection and try again.');
    }
  }
}

// ── Unit Toggle ────────────────────────────────────────────────────────────────

function handleUnitToggle(): void {
  if (!currentData) return;
  isCelsius = !isCelsius;
  unitToggle.textContent = isCelsius ? '°F' : '°C';
  renderCurrentWeather(currentData, isCelsius);
  renderForecast(forecastDays, isCelsius);
}

// ── Event Listeners ────────────────────────────────────────────────────────────

searchBtn.addEventListener('click', handleSearch);
searchInput.addEventListener('keydown', (e) => {
  if (e.key === 'Enter') handleSearch();
});
unitToggle.addEventListener('click', handleUnitToggle);
errorBox.addEventListener('click', dismissError);
