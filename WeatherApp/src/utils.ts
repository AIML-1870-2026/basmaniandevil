/**
 * Convert Fahrenheit to Celsius
 */
export function toCelsius(f: number): number {
  return (f - 32) * (5 / 9);
}

/**
 * Convert Celsius to Fahrenheit
 */
export function toFahrenheit(c: number): number {
  return c * (9 / 5) + 32;
}

/**
 * Round a number to one decimal place
 */
export function round1(n: number): number {
  return Math.round(n * 10) / 10;
}

/**
 * Convert a Unix timestamp to a human-readable time string (e.g. "6:42 AM")
 */
export function formatTime(unix: number): string {
  const date = new Date(unix * 1000);
  return date.toLocaleTimeString([], { hour: 'numeric', minute: '2-digit' });
}

/**
 * Get the abbreviated day name from a Unix timestamp (e.g. "Mon")
 */
export function getDayName(unix: number): string {
  return new Date(unix * 1000).toLocaleDateString([], { weekday: 'short' });
}

/**
 * Convert wind degrees to a compass direction string
 */
export function windDirection(deg: number): string {
  const dirs = ['N', 'NE', 'E', 'SE', 'S', 'SW', 'W', 'NW'];
  return dirs[Math.round(deg / 45) % 8];
}

/**
 * Capitalize first letter of each word
 */
export function titleCase(str: string): string {
  return str.replace(/\b\w/g, (c) => c.toUpperCase());
}

/**
 * Determine the weather theme key from an OWM condition ID
 */
export function conditionToTheme(
  id: number
): 'clear' | 'cloudy' | 'rainy' | 'snow' | 'storm' | 'mist' {
  if (id >= 200 && id < 300) return 'storm';
  if (id >= 300 && id < 600) return 'rainy';
  if (id >= 600 && id < 700) return 'snow';
  if (id >= 700 && id < 800) return 'mist';
  if (id === 800) return 'clear';
  if (id > 800) return 'cloudy';
  return 'clear';
}
