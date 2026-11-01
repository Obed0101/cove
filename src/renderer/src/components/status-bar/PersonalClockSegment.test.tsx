// @vitest-environment happy-dom
import { act, cleanup, render } from '@testing-library/react'
import { afterEach, describe, expect, it, vi } from 'vitest'
import {
  PersonalClock,
  PersonalClockSegment,
  readClockVisible,
  saveClockVisible
} from './PersonalClockSegment'

afterEach(() => {
  cleanup()
  vi.useRealTimers()
  vi.unstubAllGlobals()
})

describe('device-local clock visibility', () => {
  it('defaults to visible and persists only the hidden override', () => {
    const values = new Map<string, string>()
    vi.stubGlobal('localStorage', {
      getItem: (key: string) => values.get(key) ?? null,
      setItem: (key: string, value: string) => values.set(key, value),
      removeItem: (key: string) => values.delete(key)
    })
    expect(readClockVisible()).toBe(true)
    saveClockVisible(false)
    expect(readClockVisible()).toBe(false)
    saveClockVisible(true)
    expect(readClockVisible()).toBe(true)
    expect(values.size).toBe(0)
  })

  it('defaults to visible when storage is unavailable', () => {
    vi.stubGlobal('localStorage', {
      getItem: () => {
        throw new Error('unavailable')
      },
      setItem: () => {
        throw new Error('unavailable')
      },
      removeItem: () => {
        throw new Error('unavailable')
      }
    })
    expect(readClockVisible()).toBe(true)
    expect(() => saveClockVisible(false)).not.toThrow()
  })
})

it('updates at the minute boundary and cancels its timer on unmount', () => {
  vi.useFakeTimers()
  const start = Date.UTC(2026, 0, 1, 12, 34, 45)
  vi.setSystemTime(start)
  const { container, unmount } = render(<PersonalClockSegment />)
  const time = container.querySelector('time')
  const format = (value: number): string =>
    new Intl.DateTimeFormat(undefined, { hour: '2-digit', minute: '2-digit' }).format(value)
  expect(time?.textContent).toBe(format(start))
  expect(vi.getTimerCount()).toBe(1)
  act(() => vi.advanceTimersByTime(14_999))
  expect(time?.textContent).toBe(format(start))
  act(() => vi.advanceTimersByTime(1))
  expect(time?.textContent).toBe(format(start + 15_000))
  expect(vi.getTimerCount()).toBe(1)
  unmount()
  expect(vi.getTimerCount()).toBe(0)
})

it('ticks on each second boundary with the configured 12-hour seconds format', () => {
  vi.useFakeTimers()
  const start = Date.UTC(2026, 0, 1, 12, 34, 45, 600)
  vi.setSystemTime(start)
  const { container } = render(<PersonalClock hour12 seconds />)
  const time = container.querySelector('time')
  const format = (value: number): string =>
    new Intl.DateTimeFormat(undefined, {
      hour: '2-digit',
      minute: '2-digit',
      second: '2-digit',
      hour12: true
    }).format(value)
  expect(time?.textContent).toBe(format(start))
  act(() => vi.advanceTimersByTime(400))
  expect(time?.textContent).toBe(format(start + 400))
})
