import { z } from 'zod'

const WEATHER_CITY_KEY = 'orca.status-bar.weather-city.v1'
const GEOCODING_URL = 'https://geocoding-api.open-meteo.com/v1/search'
const FORECAST_URL = 'https://api.open-meteo.com/v1/forecast'

const weatherCitySchema = z.object({
  name: z.string().min(1),
  latitude: z.number().min(-90).max(90),
  longitude: z.number().min(-180).max(180)
})

export type WeatherCity = z.infer<typeof weatherCitySchema>

const geocodingResponseSchema = z.object({
  results: z.array(weatherCitySchema).optional()
})

const forecastResponseSchema = z.object({
  current: z.object({
    temperature_2m: z.number(),
    weather_code: z.number().int()
  })
})

export type TemperatureUnit = 'celsius' | 'fahrenheit'

export type CurrentWeather = {
  temperature: number
  weatherCode: number
}

export type WeatherCondition =
  | 'clear'
  | 'partly-cloudy'
  | 'cloudy'
  | 'fog'
  | 'drizzle'
  | 'rain'
  | 'snow'
  | 'storm'

export function readWeatherCity(): WeatherCity | null {
  try {
    const stored = localStorage.getItem(WEATHER_CITY_KEY)
    if (!stored) {
      return null
    }
    const parsed = weatherCitySchema.safeParse(JSON.parse(stored))
    return parsed.success ? parsed.data : null
  } catch {
    return null
  }
}

export function saveWeatherCity(city: WeatherCity | null): void {
  try {
    if (city) {
      localStorage.setItem(WEATHER_CITY_KEY, JSON.stringify(city))
    } else {
      localStorage.removeItem(WEATHER_CITY_KEY)
    }
  } catch {
    // Keep the current session usable if device storage is unavailable.
  }
}

export async function findWeatherCity({
  query,
  language,
  signal
}: {
  query: string
  language: string
  signal?: AbortSignal
}): Promise<WeatherCity | null> {
  const params = new URLSearchParams({ name: query, count: '1', language, format: 'json' })
  const response = await fetch(`${GEOCODING_URL}?${params}`, { signal })
  if (!response.ok) {
    throw new Error(`[WEATHER]: geocoding failed with HTTP ${response.status}`)
  }
  const parsed = geocodingResponseSchema.parse(await response.json())
  return parsed.results?.[0] ?? null
}

export async function fetchCurrentWeather({
  city,
  unit,
  signal
}: {
  city: WeatherCity
  unit: TemperatureUnit
  signal?: AbortSignal
}): Promise<CurrentWeather> {
  const params = new URLSearchParams({
    latitude: String(city.latitude),
    longitude: String(city.longitude),
    current: 'temperature_2m,weather_code',
    temperature_unit: unit
  })
  const response = await fetch(`${FORECAST_URL}?${params}`, { signal })
  if (!response.ok) {
    throw new Error(`[WEATHER]: forecast failed with HTTP ${response.status}`)
  }
  const { current } = forecastResponseSchema.parse(await response.json())
  return { temperature: current.temperature_2m, weatherCode: current.weather_code }
}

const FAHRENHEIT_TIME_ZONE_PREFIXES = [
  'America/New_York',
  'America/Detroit',
  'America/Kentucky/',
  'America/Indiana/',
  'America/Chicago',
  'America/Menominee',
  'America/North_Dakota/',
  'America/Denver',
  'America/Boise',
  'America/Phoenix',
  'America/Los_Angeles',
  'America/Anchorage',
  'America/Juneau',
  'America/Sitka',
  'America/Metlakatla',
  'America/Yakutat',
  'America/Nome',
  'America/Adak',
  'Pacific/Honolulu',
  'Africa/Monrovia',
  'Asia/Yangon'
] as const

// Time zone, not UI language, tracks where the user is: an English UI in Panama still reads Celsius.
export function resolveTemperatureUnit(timeZone: string | undefined): TemperatureUnit {
  return timeZone && FAHRENHEIT_TIME_ZONE_PREFIXES.some((prefix) => timeZone.startsWith(prefix))
    ? 'fahrenheit'
    : 'celsius'
}

// WMO weather interpretation codes, as returned by Open-Meteo.
export function resolveWeatherCondition(weatherCode: number): WeatherCondition {
  if (weatherCode <= 1) {
    return 'clear'
  }
  if (weatherCode === 2) {
    return 'partly-cloudy'
  }
  if (weatherCode === 3) {
    return 'cloudy'
  }
  if (weatherCode === 45 || weatherCode === 48) {
    return 'fog'
  }
  if (weatherCode >= 51 && weatherCode <= 57) {
    return 'drizzle'
  }
  if ((weatherCode >= 71 && weatherCode <= 77) || weatherCode === 85 || weatherCode === 86) {
    return 'snow'
  }
  if (weatherCode >= 95) {
    return 'storm'
  }
  return 'rain'
}
