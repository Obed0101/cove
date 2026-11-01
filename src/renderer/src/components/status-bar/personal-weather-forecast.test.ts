import { afterEach, describe, expect, it, vi } from 'vitest'
import {
  fetchCurrentWeather,
  findWeatherCity,
  readWeatherCity,
  resolveTemperatureUnit,
  resolveWeatherCondition,
  saveWeatherCity
} from './personal-weather-forecast'

const MADRID = { name: 'Madrid', latitude: 40.4165, longitude: -3.70256 }

function stubLocalStorage(initial: Record<string, string> = {}): Map<string, string> {
  const store = new Map(Object.entries(initial))
  vi.stubGlobal('localStorage', {
    getItem: (key: string) => store.get(key) ?? null,
    setItem: (key: string, value: string) => store.set(key, value),
    removeItem: (key: string) => store.delete(key)
  })
  return store
}

function stubFetchJson(body: unknown, status = 200): ReturnType<typeof vi.fn> {
  const fetchMock = vi.fn(async () => new Response(JSON.stringify(body), { status }))
  vi.stubGlobal('fetch', fetchMock)
  return fetchMock
}

afterEach(() => {
  vi.unstubAllGlobals()
})

describe('resolveWeatherCondition', () => {
  it.each([
    [0, 'clear'],
    [2, 'partly-cloudy'],
    [3, 'cloudy'],
    [48, 'fog'],
    [55, 'drizzle'],
    [63, 'rain'],
    [81, 'rain'],
    [75, 'snow'],
    [86, 'snow'],
    [96, 'storm']
  ])('maps WMO code %i to %s', (code, condition) => {
    expect(resolveWeatherCondition(code)).toBe(condition)
  })
})

describe('resolveTemperatureUnit', () => {
  it('uses Fahrenheit for US time zones and Celsius elsewhere, regardless of UI language', () => {
    expect(resolveTemperatureUnit('America/Indiana/Indianapolis')).toBe('fahrenheit')
    expect(resolveTemperatureUnit('Pacific/Honolulu')).toBe('fahrenheit')
    expect(resolveTemperatureUnit('America/Panama')).toBe('celsius')
    expect(resolveTemperatureUnit('America/Toronto')).toBe('celsius')
    expect(resolveTemperatureUnit(undefined)).toBe('celsius')
  })
})

describe('weather city storage', () => {
  it('round-trips a saved city and clears it', () => {
    const store = stubLocalStorage()
    saveWeatherCity(MADRID)
    expect(readWeatherCity()).toEqual(MADRID)
    saveWeatherCity(null)
    expect(store.size).toBe(0)
  })

  it('ignores corrupt or out-of-range stored cities instead of requesting bad coordinates', () => {
    stubLocalStorage({ 'orca.status-bar.weather-city.v1': '{not json' })
    expect(readWeatherCity()).toBeNull()
    stubLocalStorage({
      'orca.status-bar.weather-city.v1': JSON.stringify({ ...MADRID, latitude: 120 })
    })
    expect(readWeatherCity()).toBeNull()
  })
})

describe('Open-Meteo requests', () => {
  it('returns the first geocoding match and null when nothing matches', async () => {
    stubFetchJson({ results: [{ ...MADRID, country: 'Spain' }] })
    await expect(findWeatherCity({ query: 'Madrid', language: 'es' })).resolves.toEqual(MADRID)
    stubFetchJson({})
    await expect(findWeatherCity({ query: 'Nowhere', language: 'en' })).resolves.toBeNull()
  })

  it('requests current temperature in the resolved unit', async () => {
    const fetchMock = stubFetchJson({ current: { temperature_2m: 22.3, weather_code: 0 } })
    await expect(fetchCurrentWeather({ city: MADRID, unit: 'celsius' })).resolves.toEqual({
      temperature: 22.3,
      weatherCode: 0
    })
    const url = new URL(String(fetchMock.mock.calls[0]?.[0]))
    expect(url.searchParams.get('temperature_unit')).toBe('celsius')
    expect(url.searchParams.get('current')).toBe('temperature_2m,weather_code')
  })

  it('rejects HTTP failures and malformed forecasts', async () => {
    stubFetchJson({ reason: 'busy' }, 503)
    await expect(fetchCurrentWeather({ city: MADRID, unit: 'celsius' })).rejects.toThrow('HTTP 503')
    stubFetchJson({ current: { temperature_2m: 'warm' } })
    await expect(fetchCurrentWeather({ city: MADRID, unit: 'celsius' })).rejects.toThrow()
  })
})
