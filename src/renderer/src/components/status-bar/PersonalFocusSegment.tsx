import { Check, ChevronUp, Clock, RotateCcw } from 'lucide-react'
import { useCallback, useEffect, useState } from 'react'
import { toast } from 'sonner'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger
} from '@/components/ui/dropdown-menu'
import { translate } from '@/i18n/i18n'
import { useCoveConfigSnapshot } from '@/lib/cove-config-sync'
import { cn } from '@/lib/utils'
import { FocusProgressRing } from './FocusProgressRing'
import {
  FOCUS_PRESET_MINUTES,
  focusRemainingMs,
  formatFocusRemaining,
  readFocusTimer,
  resetFocus,
  saveFocusTimer,
  settleFocus,
  startFocus,
  pauseFocus,
  type FocusTimerState
} from './personal-focus-timer'
import { STATUS_BAR_CONTEXT_MENU_EXEMPT_PROPS } from './status-bar-context-menu-policy'

const COMPLETE_PULSE_MS = 600

function focusLabel(remainingMs: number, running: boolean): string {
  if (!running && remainingMs === 0) {
    return translate('statusBar.focusComplete', 'Focus complete · Restart')
  }
  const time = formatFocusRemaining(remainingMs)
  return running
    ? translate('statusBar.focusRunning', 'Pause · {{time}}', { time })
    : translate('statusBar.focusIdle', 'Focus · {{time}}', { time })
}

function usePersonalFocusTimer(): {
  state: FocusTimerState
  now: number
  pulsing: boolean
  toggle: () => void
  reset: (durationMs?: number) => void
} {
  const configMinutes = useCoveConfigSnapshot().config.footer?.focus?.minutes
  const configDurationMs = configMinutes === undefined ? undefined : configMinutes * 60_000
  // Why: a run that ended while the app was closed settles quietly; only a live finish notifies.
  const [state, setState] = useState(() =>
    settleFocus(readFocusTimer(configDurationMs), Date.now())
  )
  const [now, setNow] = useState(() => Date.now())
  const [pulsing, setPulsing] = useState(false)

  const update = useCallback((next: (current: FocusTimerState) => FocusTimerState): void => {
    setState((current) => {
      const value = next(current)
      if (value !== current) {
        saveFocusTimer(value)
      }
      return value
    })
  }, [])

  useEffect(() => {
    if (configDurationMs === undefined) {
      return
    }
    update((current) =>
      current.deadline === null && current.durationMs !== configDurationMs
        ? resetFocus(current, configDurationMs)
        : current
    )
  }, [configDurationMs, update])

  const restart = useCallback((): void => {
    const current = Date.now()
    setNow(current)
    update((value) => startFocus(resetFocus(value), current))
  }, [update])

  useEffect(() => {
    if (state.deadline === null) {
      return
    }
    const deadline = state.deadline
    const timer = setInterval(() => {
      const current = Date.now()
      setNow(current)
      if (current < deadline) {
        return
      }
      update((value) => settleFocus(value, current))
      setPulsing(true)
      toast.success(translate('statusBar.focusSessionComplete', 'Focus session complete'), {
        action: { label: translate('statusBar.focusRestart', 'Restart'), onClick: restart }
      })
    }, 1000)
    return () => clearInterval(timer)
  }, [state.deadline, update, restart])

  useEffect(() => {
    if (!pulsing) {
      return
    }
    const timer = setTimeout(() => setPulsing(false), COMPLETE_PULSE_MS)
    return () => clearTimeout(timer)
  }, [pulsing])

  const toggle = (): void => {
    const current = Date.now()
    setNow(current)
    update((value) =>
      value.deadline === null ? startFocus(value, current) : pauseFocus(value, current)
    )
  }
  const reset = (durationMs?: number): void => update((value) => resetFocus(value, durationMs))

  return { state, now, pulsing, toggle, reset }
}

export function PersonalFocusSegment(): React.JSX.Element {
  const { state, now, pulsing, toggle, reset } = usePersonalFocusTimer()
  const running = state.deadline !== null
  const remainingMs = focusRemainingMs(state, now)
  const midRun = running || (remainingMs > 0 && remainingMs < state.durationMs)
  const presetsLabel = translate('statusBar.focusOptions', 'Focus options')

  return (
    <span
      data-focus-complete-pulse={pulsing || undefined}
      className={cn(
        'inline-flex items-center rounded-md',
        pulsing && 'animate-[cove-focus-complete_600ms_ease-out] motion-reduce:animate-none'
      )}
    >
      <button
        type="button"
        aria-pressed={running}
        onClick={toggle}
        className="inline-flex items-center gap-1.5 rounded-md py-[3px] pl-2 pr-1 tabular-nums transition-colors hover:bg-accent/70 hover:text-foreground"
      >
        {midRun ? (
          <FocusProgressRing progress={1 - remainingMs / state.durationMs} />
        ) : (
          <Clock className="size-[13px]" aria-hidden="true" />
        )}
        <span>{focusLabel(remainingMs, running)}</span>
      </button>
      <DropdownMenu modal={false}>
        <DropdownMenuTrigger asChild>
          <button
            type="button"
            aria-label={presetsLabel}
            className="inline-flex h-[21px] w-4 items-center justify-center rounded-md text-muted-foreground transition-colors hover:bg-accent/70 hover:text-foreground data-[state=open]:bg-accent/70 data-[state=open]:text-foreground"
          >
            <ChevronUp className="size-3" aria-hidden="true" />
          </button>
        </DropdownMenuTrigger>
        <DropdownMenuContent
          {...STATUS_BAR_CONTEXT_MENU_EXEMPT_PROPS}
          side="top"
          align="start"
          sideOffset={8}
          className="min-w-[160px]"
        >
          <DropdownMenuLabel>
            {translate('statusBar.focusLength', 'Session length')}
          </DropdownMenuLabel>
          {FOCUS_PRESET_MINUTES.map((minutes) => {
            const selected = state.durationMs === minutes * 60_000
            return (
              <DropdownMenuItem key={minutes} onSelect={() => reset(minutes * 60_000)}>
                <Check className={cn('size-3.5', !selected && 'invisible')} aria-hidden="true" />
                {translate('statusBar.focusMinutes', '{{minutes}} min', { minutes })}
              </DropdownMenuItem>
            )
          })}
          <DropdownMenuSeparator />
          <DropdownMenuItem onSelect={() => reset()}>
            <RotateCcw className="size-3.5" aria-hidden="true" />
            {translate('statusBar.focusReset', 'Reset')}
          </DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>
    </span>
  )
}
