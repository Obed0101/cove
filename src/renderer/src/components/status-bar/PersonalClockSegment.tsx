import { Clock } from 'lucide-react'
import { useEffect, useState } from 'react'
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover'
import { translate } from '@/i18n/i18n'
import { useCoveConfigSnapshot } from '@/lib/cove-config-sync'
import { PersonalClockPopover } from './PersonalClockPopover'
import { STATUS_BAR_CONTEXT_MENU_EXEMPT_PROPS } from './status-bar-context-menu-policy'

const CLOCK_HIDDEN_KEY = 'orca.status-bar.clock-hidden.v1'
const NO_TIME_ZONES: readonly string[] = []

export function readClockVisible(): boolean {
  try {
    return localStorage.getItem(CLOCK_HIDDEN_KEY) !== 'true'
  } catch {
    return true
  }
}

export function saveClockVisible(visible: boolean): void {
  try {
    if (visible) {
      localStorage.removeItem(CLOCK_HIDDEN_KEY)
    } else {
      localStorage.setItem(CLOCK_HIDDEN_KEY, 'true')
    }
  } catch {
    // Keep the current session usable if device storage is unavailable.
  }
}

/** Current time, re-rendered exactly on each `stepMs` boundary rather than on a drifting interval. */
function useAlignedNow(stepMs: number): Date {
  const [now, setNow] = useState(() => new Date())

  useEffect(() => {
    let timer: ReturnType<typeof setTimeout>
    const update = (): void => {
      const current = new Date()
      setNow(current)
      timer = setTimeout(update, stepMs - (current.getTime() % stepMs))
    }
    update()
    return () => clearTimeout(timer)
  }, [stepMs])

  return now
}

export type PersonalClockProps = {
  hour12?: boolean
  seconds?: boolean
  timeZones?: readonly string[]
}

export function PersonalClock({
  hour12,
  seconds = false,
  timeZones = NO_TIME_ZONES
}: PersonalClockProps): React.JSX.Element {
  const now = useAlignedNow(seconds ? 1000 : 60_000)
  const time = new Intl.DateTimeFormat(undefined, {
    hour: '2-digit',
    minute: '2-digit',
    second: seconds ? '2-digit' : undefined,
    hour12
  }).format(now)

  return (
    <Popover>
      <PopoverTrigger asChild>
        <button
          type="button"
          className="inline-flex items-center gap-2 rounded-md px-2 py-[3px] text-muted-foreground tabular-nums transition-colors hover:bg-accent/70 hover:text-foreground data-[state=open]:bg-accent/70 data-[state=open]:text-foreground"
        >
          <Clock className="size-[13px]" aria-hidden="true" />
          <time
            dateTime={now.toISOString()}
            aria-label={`${translate('statusBar.clock', 'Clock')}: ${time}`}
          >
            {time}
          </time>
        </button>
      </PopoverTrigger>
      <PopoverContent
        side="top"
        align="end"
        sideOffset={8}
        aria-label={translate('statusBar.clockCalendar', 'Calendar')}
        {...STATUS_BAR_CONTEXT_MENU_EXEMPT_PROPS}
        className="w-[248px] max-w-[calc(100vw-2rem)] p-3"
      >
        <PersonalClockPopover now={now} hour12={hour12} timeZones={timeZones} />
      </PopoverContent>
    </Popover>
  )
}

export function PersonalClockSegment(): React.JSX.Element {
  const clock = useCoveConfigSnapshot().config.footer?.clock
  return (
    <PersonalClock hour12={clock?.hour12} seconds={clock?.seconds} timeZones={clock?.timeZones} />
  )
}
