export type MonthGridCell = { date: Date; inMonth: boolean; isToday: boolean }

const GRID_WEEKS = 6
const DAY_MS = 86_400_000

/** First day of the week for a locale as 0 (Sunday) … 6 (Saturday); Monday when the runtime cannot tell. */
export function localeWeekStart(locale?: string): number {
  try {
    const intlLocale = new Intl.Locale(locale ?? navigator.language)
    const getWeekInfo: unknown = Reflect.get(intlLocale, 'getWeekInfo')
    const weekInfo: unknown =
      typeof getWeekInfo === 'function'
        ? getWeekInfo.call(intlLocale)
        : Reflect.get(intlLocale, 'weekInfo')
    const firstDay: unknown =
      typeof weekInfo === 'object' && weekInfo !== null
        ? Reflect.get(weekInfo, 'firstDay')
        : undefined
    return typeof firstDay === 'number' ? firstDay % 7 : 1
  } catch {
    return 1
  }
}

function sameLocalDay(a: Date, b: Date): boolean {
  return (
    a.getFullYear() === b.getFullYear() &&
    a.getMonth() === b.getMonth() &&
    a.getDate() === b.getDate()
  )
}

/** Six full weeks around `today`'s month; cells are built from local y/m/d so DST never skips a day. */
export function buildMonthGrid(today: Date, weekStartsOn: number): MonthGridCell[][] {
  const year = today.getFullYear()
  const month = today.getMonth()
  const leading = (new Date(year, month, 1).getDay() - weekStartsOn + 7) % 7
  return Array.from({ length: GRID_WEEKS }, (_, week) =>
    Array.from({ length: 7 }, (_, weekday) => {
      const date = new Date(year, month, 1 - leading + week * 7 + weekday)
      return { date, inMonth: date.getMonth() === month, isToday: sameLocalDay(date, today) }
    })
  )
}

export function isoWeekNumber(date: Date): number {
  const utc = Date.UTC(date.getFullYear(), date.getMonth(), date.getDate())
  const weekday = new Date(utc).getUTCDay() || 7
  const thursday = utc + (4 - weekday) * DAY_MS
  const yearStart = Date.UTC(new Date(thursday).getUTCFullYear(), 0, 1)
  return Math.floor((thursday - yearStart) / DAY_MS / 7) + 1
}

/** Calendar-day difference between a time zone and the local zone at `now` (-1, 0 or +1). */
export function timeZoneDayOffset(now: Date, timeZone: string): number {
  const parts = new Intl.DateTimeFormat('en-US', {
    timeZone,
    year: 'numeric',
    month: 'numeric',
    day: 'numeric'
  }).formatToParts(now)
  const part = (type: string): number => Number(parts.find((p) => p.type === type)?.value)
  const zoned = Date.UTC(part('year'), part('month') - 1, part('day'))
  const local = Date.UTC(now.getFullYear(), now.getMonth(), now.getDate())
  return Math.round((zoned - local) / DAY_MS)
}

export function timeZoneCityLabel(timeZone: string): string {
  return (timeZone.split('/').pop() ?? timeZone).replaceAll('_', ' ')
}
