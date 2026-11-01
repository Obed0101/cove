export const DEFAULT_FOCUS_DURATION_MS = 25 * 60 * 1000
export const FOCUS_PRESET_MINUTES = [15, 25, 50] as const

const FOCUS_TIMER_KEY = 'orca.status-bar.focus-timer.v1'

export type FocusTimerState = {
  durationMs: number
  /** Wall-clock end of the running session; null while idle or paused. */
  deadline: number | null
  pausedRemainingMs: number
}

export function idleFocusTimer(durationMs = DEFAULT_FOCUS_DURATION_MS): FocusTimerState {
  return { durationMs, deadline: null, pausedRemainingMs: durationMs }
}

export function focusRemainingMs(state: FocusTimerState, now: number): number {
  return state.deadline === null ? state.pausedRemainingMs : Math.max(0, state.deadline - now)
}

export function isFocusComplete(state: FocusTimerState, now: number): boolean {
  return focusRemainingMs(state, now) === 0
}

export function startFocus(state: FocusTimerState, now: number): FocusTimerState {
  if (state.deadline !== null) {
    return state
  }
  const remaining = state.pausedRemainingMs || state.durationMs
  return { ...state, deadline: now + remaining, pausedRemainingMs: remaining }
}

export function pauseFocus(state: FocusTimerState, now: number): FocusTimerState {
  if (state.deadline === null) {
    return state
  }
  return { ...state, deadline: null, pausedRemainingMs: focusRemainingMs(state, now) }
}

/** A run that reached its deadline settles to the paused-at-zero "complete" state. */
export function settleFocus(state: FocusTimerState, now: number): FocusTimerState {
  return state.deadline !== null && now >= state.deadline
    ? { ...state, deadline: null, pausedRemainingMs: 0 }
    : state
}

export function resetFocus(state: FocusTimerState, durationMs = state.durationMs): FocusTimerState {
  return idleFocusTimer(durationMs)
}

function isFocusTimerState(value: unknown): value is FocusTimerState {
  if (typeof value !== 'object' || value === null) {
    return false
  }
  const durationMs: unknown = Reflect.get(value, 'durationMs')
  const deadline: unknown = Reflect.get(value, 'deadline')
  const pausedRemainingMs: unknown = Reflect.get(value, 'pausedRemainingMs')
  return (
    typeof durationMs === 'number' &&
    Number.isFinite(durationMs) &&
    durationMs > 0 &&
    (deadline === null || (typeof deadline === 'number' && Number.isFinite(deadline))) &&
    typeof pausedRemainingMs === 'number' &&
    pausedRemainingMs >= 0 &&
    pausedRemainingMs <= durationMs
  )
}

export function readFocusTimer(fallbackDurationMs = DEFAULT_FOCUS_DURATION_MS): FocusTimerState {
  try {
    const raw = localStorage.getItem(FOCUS_TIMER_KEY)
    const parsed: unknown = raw ? JSON.parse(raw) : null
    return isFocusTimerState(parsed) ? parsed : idleFocusTimer(fallbackDurationMs)
  } catch {
    return idleFocusTimer(fallbackDurationMs)
  }
}

export function saveFocusTimer(state: FocusTimerState): void {
  try {
    localStorage.setItem(FOCUS_TIMER_KEY, JSON.stringify(state))
  } catch {
    // Keep the current session usable if device storage is unavailable.
  }
}

export function formatFocusRemaining(remainingMs: number): string {
  const seconds = Math.ceil(remainingMs / 1000)
  const minutes = String(Math.floor(seconds / 60)).padStart(2, '0')
  return `${minutes}:${String(seconds % 60).padStart(2, '0')}`
}
