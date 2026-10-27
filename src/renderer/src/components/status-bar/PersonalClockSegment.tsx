import { Clock } from 'lucide-react'
import { useEffect, useState } from 'react'
import { translate } from '@/i18n/i18n'

const CLOCK_HIDDEN_KEY = 'orca.status-bar.clock-hidden.v1'

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

export function PersonalClockSegment(): React.JSX.Element {
  const [now, setNow] = useState(() => new Date())

  useEffect(() => {
    let timer: ReturnType<typeof setTimeout>
    const update = (): void => {
      const current = new Date()
      setNow(current)
      timer = setTimeout(update, 60_000 - (current.getTime() % 60_000))
    }
    update()
    return () => clearTimeout(timer)
  }, [])

  const time = new Intl.DateTimeFormat(undefined, { hour: '2-digit', minute: '2-digit' }).format(
    now
  )
  return (
    <span className="inline-flex items-center gap-1.5 text-muted-foreground tabular-nums">
      <Clock className="size-3.5" aria-hidden="true" />
      <time
        dateTime={now.toISOString()}
        aria-label={`${translate('statusBar.clock', 'Clock')}: ${time}`}
      >
        {time}
      </time>
    </span>
  )
}
