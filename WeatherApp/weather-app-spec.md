# Weather App — Build Specification

## Overview

Build a single-page weather application that allows a user to search any city in the world and view comprehensive weather information. The app should be visually striking, responsive, and production-grade.

---

## Tech Stack

- **HTML** — Semantic markup, single `index.html` entry point
- **TypeScript** — All logic written in TypeScript (compiled to JS)
- **CSS** — Custom stylesheet (`styles.css`), no CSS frameworks. Use CSS variables for theming.

Use a bundler like **Vite** for the TypeScript build step.

---

## API

- **Provider:** OpenWeatherMap
- **API Key:** `2d95846d49911932de92461f7d0645c5`
- **Endpoints to use:**
  - **Current Weather:** `https://api.openweathermap.org/data/2.5/weather?q={city}&appid={API_KEY}&units=imperial`
  - **5-Day / 3-Hour Forecast:** `https://api.openweathermap.org/data/2.5/forecast?q={city}&appid={API_KEY}&units=imperial`
  - **Weather Icon:** `https://openweathermap.org/img/wn/{icon_code}@2x.png`

Default to **imperial** units (°F) but include a toggle to switch between °F and °C.

---

## Features

### 1. City Search
- A prominent search bar at the top of the page.
- User types a city name and presses Enter or clicks a search button.
- Handle errors gracefully (city not found, network errors) with a user-friendly message.

### 2. Current Weather Display
Show the following for the searched city:
- City name and country code
- Current temperature (large, prominent)
- Weather condition description (e.g., "Scattered Clouds") with matching icon from the API
- Feels-like temperature
- Humidity percentage
- Wind speed and direction
- Atmospheric pressure
- Visibility distance
- Sunrise and sunset times (converted to local readable time)

### 3. 5-Day Forecast
- Display a horizontal row of cards, one per day, below the current weather.
- Each card shows:
  - Day of the week
  - Weather icon
  - High / Low temperature for that day
  - Brief condition text
- Aggregate the 3-hour data points to derive daily highs, lows, and the most frequent weather condition.

### 4. Unit Toggle
- A toggle or button to switch between Fahrenheit (°F) and Celsius (°C).
- Switching units should re-render displayed temperatures without a new API call (convert client-side).

### 5. Dynamic Background / Theme
- The app's background or color accent should change based on the current weather condition returned by the API:
  - **Clear/Sunny** — warm golden/amber tones
  - **Cloudy** — cool grey-blue tones
  - **Rainy/Drizzle** — deep blue/teal tones
  - **Snow** — icy white/light blue tones
  - **Thunderstorm** — dark purple/charcoal tones
  - **Mist/Fog** — muted, desaturated palette
- Transition smoothly between themes using CSS transitions.

---

## Design Direction

### Aesthetic: Atmospheric & Editorial
Think of a premium weather dashboard — NOT a generic card-based layout. The design should feel immersive, like you're looking through a window at the weather.

### Typography
- Use **"Outfit"** (Google Fonts) for headings — geometric, modern, with character.
- Use **"Source Serif 4"** (Google Fonts) for body/detail text — elegant and readable.
- Temperature should be displayed in an oversized, bold style (e.g., 96px+).

### Color System (CSS Variables)
Define a base palette with CSS variables that the dynamic theme system overrides:
```css
:root {
  --bg-primary: #0f1923;
  --bg-secondary: #1a2a3a;
  --text-primary: #f0f0f0;
  --text-secondary: #a0b0c0;
  --accent: #f5a623;
  --card-bg: rgba(255, 255, 255, 0.06);
  --card-border: rgba(255, 255, 255, 0.1);
}
```

### Layout
- Full-viewport, dark-themed by default.
- Search bar centered at top with a subtle frosted-glass effect (`backdrop-filter: blur`).
- Current weather info takes up the hero section — large temperature on the left, details on the right.
- Forecast cards sit in a horizontally scrollable row at the bottom.
- Use CSS Grid or Flexbox for layout.

### Visual Details
- Subtle grain/noise texture overlay on the background for depth.
- Frosted-glass cards (`backdrop-filter: blur`, semi-transparent backgrounds).
- Smooth fade-in animations when weather data loads (use CSS `@keyframes`).
- Weather icons should have a soft glow or drop-shadow matching the condition color.
- Hover effects on forecast cards (slight lift + glow).

### Responsive Design
- Mobile-first: stack layout vertically on small screens.
- Forecast cards scroll horizontally on mobile, wrap on desktop if space allows.
- Search bar should be full-width on mobile, constrained on desktop.

---

## Project Structure

```
weather-app/
├── index.html
├── src/
│   ├── main.ts          # Entry point, DOM setup, event listeners
│   ├── api.ts           # API fetch functions (current weather, forecast)
│   ├── ui.ts            # DOM rendering functions
│   ├── utils.ts         # Unit conversion, date formatting, helpers
│   └── types.ts         # TypeScript interfaces for API responses
├── styles/
│   └── styles.css       # All styling
├── tsconfig.json
├── package.json
└── vite.config.ts
```

---

## TypeScript Interfaces (Guidance for `types.ts`)

```typescript
interface WeatherData {
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

interface ForecastDay {
  day: string;
  high: number;
  low: number;
  description: string;
  icon: string;
}
```

---

## Error Handling

- Show a styled error message inline (not `alert()`) when:
  - City is not found (API returns 404)
  - Network request fails
  - User submits an empty search
- The error message should fade in and auto-dismiss after 5 seconds, or dismiss on click.

---

## Animations

- **Page load:** Search bar fades in and slides down.
- **Data load:** Weather info fades in with a staggered delay (temperature first, then details, then forecast).
- **Theme change:** Background color transitions over 0.8s ease.
- **Forecast cards:** Stagger entrance with `animation-delay` on each card.

---

## Additional Notes

- No frameworks (React, Vue, etc.) — vanilla TypeScript only.
- Keep the codebase clean and well-commented.
- Ensure all TypeScript is strictly typed (no `any` unless absolutely necessary).
- The app should work immediately on `npm run dev` after setup with Vite.
