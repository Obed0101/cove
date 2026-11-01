import {
  Cloud,
  CloudDrizzle,
  CloudFog,
  CloudLightning,
  CloudRain,
  CloudSnow,
  CloudSun,
  Sun,
  X,
  type LucideIcon
} from 'lucide-react'
import { useEffect, useRef, useState } from 'react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover'
import { getIntlLocale, translate } from '@/i18n/i18n'
import { STATUS_BAR_CONTEXT_MENU_EXEMPT_PROPS } from './status-bar-context-menu-policy'
import {
  fetchCurrentWeather,
  findWeatherCity,
  readWeatherCity,
  resolveTemperatureUnit,
  resolveWeatherCondition,
  saveWeatherCity,
  type CurrentWeather,
  type WeatherCity,
  type WeatherCondition
} from './personal-weather-forecast'

const WEATHER_REFRESH_MS = 30 * 60 * 1000

const WEATHER_ICONS: Record<WeatherCondition, LucideIcon> = {
  clear: Sun,
  'partly-cloudy': CloudSun,
  cloudy: Cloud,
  fog: CloudFog,
  drizzle: CloudDrizzle,
  rain: CloudRain,
  snow: CloudSnow,
  storm: CloudLightning
}

type CitySearchState = 'idle' | 'searching' | 'not-found' | 'failed'

function useCurrentWeather(city: WeatherCity | null): {
  weather: CurrentWeather | null
  failed: boolean
} {
  const [weather, setWeather] = useState<CurrentWeather | null>(null)
  const [failed, setFailed] = useState(false)

  useEffect(() => {
    setWeather(null)
    setFailed(false)
    if (!city) {
      return
    }
    const controller = new AbortController()
    const unit = resolveTemperatureUnit(Intl.DateTimeFormat().resolvedOptions().timeZone)
    const refresh = (): void => {
      fetchCurrentWeather({ city, unit, signal: controller.signal })
        .then((next) => {
          setWeather(next)
          setFailed(false)
        })
        .catch(() => {
          if (!controller.signal.aborted) {
            setFailed(true)
          }
        })
    }
    refresh()
    const interval = window.setInterval(refresh, WEATHER_REFRESH_MS)
    return () => {
      controller.abort()
      window.clearInterval(interval)
    }
  }, [city])

  return { weather, failed }
}

export function PersonalWeatherSegment(): React.JSX.Element {
  const [open, setOpen] = useState(false)
  const [city, setCity] = useState(readWeatherCity)
  const [query, setQuery] = useState(() => city?.name ?? '')
  const [searchState, setSearchState] = useState<CitySearchState>('idle')
  const inputRef = useRef<HTMLInputElement>(null)
  const { weather, failed } = useCurrentWeather(city)
  const title = translate('statusBar.weather', 'Weather')
  const WeatherIcon = weather ? WEATHER_ICONS[resolveWeatherCondition(weather.weatherCode)] : Sun
  const temperature = weather ? `${Math.round(weather.temperature)}°` : failed ? '–°' : null

  const handleSubmit = async (event: React.FormEvent<HTMLFormElement>): Promise<void> => {
    event.preventDefault()
    const trimmed = query.trim()
    if (!trimmed) {
      return
    }
    setSearchState('searching')
    try {
      const found = await findWeatherCity({
        query: trimmed,
        language: getIntlLocale().split('-')[0] ?? 'en'
      })
      if (!found) {
        setSearchState('not-found')
        return
      }
      setCity(found)
      saveWeatherCity(found)
      setQuery(found.name)
      setSearchState('idle')
      setOpen(false)
    } catch {
      setSearchState('failed')
    }
  }

  return (
    <Popover
      open={open}
      onOpenChange={(next) => {
        setOpen(next)
        if (!next) {
          setSearchState('idle')
        }
      }}
    >
      <PopoverTrigger asChild>
        <button
          type="button"
          aria-label={
            city && weather
              ? translate('statusBar.weatherLabel', 'Weather: {{temperature}} in {{city}}', {
                  temperature: `${Math.round(weather.temperature)}°`,
                  city: city.name
                })
              : title
          }
          className="inline-flex items-center gap-1.5 rounded-md px-2 py-[3px] tabular-nums transition-colors hover:bg-accent/70 hover:text-foreground data-[state=open]:bg-accent/70 data-[state=open]:text-foreground"
        >
          <WeatherIcon className="size-[13px]" aria-hidden="true" />
          <span>
            {city
              ? temperature
                ? `${temperature} · ${city.name}`
                : city.name
              : translate('statusBar.weatherSetCity', 'Set city')}
          </span>
        </button>
      </PopoverTrigger>
      <PopoverContent
        side="top"
        align="start"
        sideOffset={8}
        aria-label={title}
        {...STATUS_BAR_CONTEXT_MENU_EXEMPT_PROPS}
        className="w-[280px] max-w-[calc(100vw-2rem)] p-3"
        onOpenAutoFocus={(event) => {
          event.preventDefault()
          inputRef.current?.focus()
          inputRef.current?.select()
        }}
      >
        <div className="mb-2 flex items-center gap-2">
          <h2 className="flex-1 text-xs font-semibold text-foreground">{title}</h2>
          <button
            type="button"
            aria-label={translate('statusBar.weatherClose', 'Close weather')}
            onClick={() => setOpen(false)}
            className="inline-flex size-6 items-center justify-center rounded-md text-muted-foreground transition-colors hover:bg-accent/70 hover:text-foreground"
          >
            <X className="size-[13px]" aria-hidden="true" />
          </button>
        </div>
        <form className="flex items-center gap-2" onSubmit={(event) => void handleSubmit(event)}>
          <Input
            ref={inputRef}
            density="compact"
            aria-label={translate('statusBar.weatherCity', 'City')}
            aria-invalid={searchState === 'not-found' || searchState === 'failed'}
            value={query}
            maxLength={120}
            placeholder={translate('statusBar.weatherCityPlaceholder', 'City, e.g. Madrid')}
            onChange={(event) => {
              setQuery(event.target.value)
              setSearchState('idle')
            }}
          />
          <Button
            type="submit"
            size="xs"
            variant="secondary"
            disabled={!query.trim() || searchState === 'searching'}
          >
            {translate('statusBar.weatherSave', 'Save')}
          </Button>
        </form>
        <p
          role={searchState === 'not-found' || searchState === 'failed' ? 'alert' : undefined}
          className="mt-2 text-[11px] text-muted-foreground"
        >
          {searchState === 'not-found'
            ? translate('statusBar.weatherNotFound', 'No city found with that name.')
            : searchState === 'failed'
              ? translate('statusBar.weatherFailed', 'Couldn’t reach Open-Meteo. Try again.')
              : translate(
                  'statusBar.weatherSource',
                  'Current weather from Open-Meteo. The city is saved on this device.'
                )}
        </p>
      </PopoverContent>
    </Popover>
  )
}
