import { useMemo } from 'react'
import { translate } from '@/i18n/i18n'
import { cn } from '@/lib/utils'
import {
  buildMonthGrid,
  isoWeekNumber,
  localeWeekStart,
  timeZoneCityLabel,
  timeZoneDayOffset
} from './clock-month-grid'

// 2024-01-07 is a Sunday; offsets from it name each weekday in the current locale.
const REFERENCE_SUNDAY = new Date(2024, 0, 7)

function weekdayNames(weekStartsOn: number, weekday: 'narrow' | 'long'): string[] {
  const format = new Intl.DateTimeFormat(undefined, { weekday })
  return Array.from({ length: 7 }, (_, index) =>
    format.format(
      new Date(
        REFERENCE_SUNDAY.getFullYear(),
        REFERENCE_SUNDAY.getMonth(),
        REFERENCE_SUNDAY.getDate() + ((weekStartsOn + index) % 7)
      )
    )
  )
}

function dayOffsetLabel(offset: number): string | null {
  if (offset === 0) {
    return null
  }
  return offset > 0
    ? translate('statusBar.clockNextDay', '+{{days}}d', { days: offset })
    : translate('statusBar.clockPreviousDay', '−{{days}}d', { days: -offset })
}

export function PersonalClockPopover({
  now,
  hour12,
  timeZones
}: {
  now: Date
  hour12: boolean | undefined
  timeZones: readonly string[]
}): React.JSX.Element {
  const weekStartsOn = useMemo(() => localeWeekStart(), [])
  const narrowNames = useMemo(() => weekdayNames(weekStartsOn, 'narrow'), [weekStartsOn])
  const longNames = useMemo(() => weekdayNames(weekStartsOn, 'long'), [weekStartsOn])
  const grid = buildMonthGrid(now, weekStartsOn)
  const longDate = new Intl.DateTimeFormat(undefined, {
    weekday: 'long',
    day: 'numeric',
    month: 'long',
    year: 'numeric'
  }).format(now)
  const monthLabel = new Intl.DateTimeFormat(undefined, { month: 'long', year: 'numeric' }).format(
    now
  )

  return (
    <div className="flex flex-col gap-3">
      <div>
        <h2 className="text-[13px] font-semibold text-foreground first-letter:uppercase">
          {longDate}
        </h2>
        <p className="mt-0.5 text-[11px] text-muted-foreground">
          {translate('statusBar.clockWeek', 'Week {{week}}', { week: isoWeekNumber(now) })}
        </p>
      </div>
      <table
        className="w-full table-fixed border-collapse text-center text-xs"
        aria-label={monthLabel}
      >
        <thead>
          <tr>
            {narrowNames.map((name, index) => (
              <th
                key={longNames[index]}
                scope="col"
                abbr={longNames[index]}
                className="pb-1 text-[11px] font-medium text-muted-foreground"
              >
                {name}
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {grid.map((week) => (
            <tr key={week[0]?.date.toDateString()}>
              {week.map((cell) => (
                <td key={cell.date.toDateString()} className="p-0">
                  <span
                    aria-current={cell.isToday ? 'date' : undefined}
                    className={cn(
                      'mx-auto flex size-7 items-center justify-center rounded-md tabular-nums',
                      cell.isToday
                        ? 'bg-primary font-medium text-primary-foreground'
                        : cell.inMonth
                          ? 'text-foreground'
                          : 'text-muted-foreground/50'
                    )}
                  >
                    {cell.date.getDate()}
                  </span>
                </td>
              ))}
            </tr>
          ))}
        </tbody>
      </table>
      {timeZones.length > 0 ? (
        <ul
          className="flex flex-col gap-1 border-t border-border pt-2"
          aria-label={translate('statusBar.clockTimeZones', 'Time zones')}
        >
          {timeZones.map((timeZone) => {
            const offset = dayOffsetLabel(timeZoneDayOffset(now, timeZone))
            return (
              <li key={timeZone} className="flex items-center gap-2 text-xs">
                <span className="min-w-0 flex-1 truncate text-muted-foreground" title={timeZone}>
                  {timeZoneCityLabel(timeZone)}
                </span>
                {offset ? (
                  <span className="text-[11px] text-muted-foreground">{offset}</span>
                ) : null}
                <span className="tabular-nums text-foreground">
                  {new Intl.DateTimeFormat(undefined, {
                    hour: '2-digit',
                    minute: '2-digit',
                    hour12,
                    timeZone
                  }).format(now)}
                </span>
              </li>
            )
          })}
        </ul>
      ) : null}
    </div>
  )
}
