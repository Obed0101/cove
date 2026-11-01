import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import {
  DEFAULT_FOCUS_DURATION_MS,
  focusRemainingMs,
  formatFocusRemaining,
  idleFocusTimer,
  pauseFocus,
  readFocusTimer,
  resetFocus,
  saveFocusTimer,
  settleFocus,
  startFocus
} from './personal-focus-timer'

const MINUTE = 60_000

describe('focus timer transitions', () => {
  it('counts down from the deadline and pauses with the remaining time', () => {
    const running = startFocus(idleFocusTimer(), 1_000)
    expect(focusRemainingMs(running, 1_000 + 2 * MINUTE)).toBe(23 * MINUTE)
    const paused = pauseFocus(running, 1_000 + 2 * MINUTE)
    expect(paused.deadline).toBeNull()
    expect(focusRemainingMs(paused, 999 * MINUTE)).toBe(23 * MINUTE)
    expect(startFocus(paused, 0).deadline).toBe(23 * MINUTE)
  })

  it('settles a run past its deadline to complete, and a restart uses the full length', () => {
    const settled = settleFocus(startFocus(idleFocusTimer(MINUTE), 0), MINUTE + 5)
    expect(settled).toMatchObject({ deadline: null, pausedRemainingMs: 0 })
    expect(startFocus(settled, 10).deadline).toBe(10 + MINUTE)
  })

  it('resets to a new session length', () => {
    const running = startFocus(idleFocusTimer(), 0)
    expect(resetFocus(running, 15 * MINUTE)).toEqual(idleFocusTimer(15 * MINUTE))
    expect(resetFocus(running)).toEqual(idleFocusTimer())
  })

  it('formats whole minutes and rounds partial seconds up', () => {
    expect(formatFocusRemaining(DEFAULT_FOCUS_DURATION_MS)).toBe('25:00')
    expect(formatFocusRemaining(61_001)).toBe('01:02')
  })
})

describe('focus timer storage', () => {
  beforeEach(() => {
    const store = new Map<string, string>()
    vi.stubGlobal('localStorage', {
      getItem: (key: string) => store.get(key) ?? null,
      setItem: (key: string, value: string) => store.set(key, value)
    })
  })
  afterEach(() => vi.unstubAllGlobals())

  it('restores a running session after a reload', () => {
    const running = startFocus(idleFocusTimer(), Date.now())
    saveFocusTimer(running)
    expect(readFocusTimer()).toEqual(running)
  })

  it('falls back to an idle session for missing or corrupted data', () => {
    expect(readFocusTimer(15 * MINUTE)).toEqual(idleFocusTimer(15 * MINUTE))
    localStorage.setItem('orca.status-bar.focus-timer.v1', '{"durationMs":-1}')
    expect(readFocusTimer()).toEqual(idleFocusTimer())
    localStorage.setItem('orca.status-bar.focus-timer.v1', 'not json')
    expect(readFocusTimer()).toEqual(idleFocusTimer())
  })
})
