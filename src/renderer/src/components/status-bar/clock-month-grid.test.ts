import { describe, expect, it } from 'vitest'
import {
  buildMonthGrid,
  isoWeekNumber,
  timeZoneCityLabel,
  timeZoneDayOffset
} from './clock-month-grid'

describe('buildMonthGrid', () => {
  it('starts on the requested weekday and marks exactly one day as today', () => {
    const today = new Date(2026, 9, 29)
    const grid = buildMonthGrid(today, 1)
    const cells = grid.flat()
    expect(cells).toHaveLength(42)
    expect(cells[0]?.date).toEqual(new Date(2026, 8, 28))
    expect(cells.filter((cell) => cell.isToday).map((cell) => cell.date)).toEqual([today])
    expect(cells.filter((cell) => cell.inMonth)).toHaveLength(31)
  })

  it('handles a Sunday week start and a month that begins on that day', () => {
    const grid = buildMonthGrid(new Date(2026, 1, 10), 0)
    expect(grid[0]?.[0]).toMatchObject({ date: new Date(2026, 1, 1), inMonth: true })
  })

  it('never skips or repeats a day across a DST change', () => {
    const days = buildMonthGrid(new Date(2026, 2, 15), 1)
      .flat()
      .map((cell) => `${cell.date.getMonth()}-${cell.date.getDate()}`)
    expect(new Set(days).size).toBe(42)
  })
})

describe('isoWeekNumber', () => {
  it('follows ISO 8601 at year boundaries', () => {
    expect(isoWeekNumber(new Date(2026, 9, 29))).toBe(44)
    expect(isoWeekNumber(new Date(2027, 0, 1))).toBe(53)
    expect(isoWeekNumber(new Date(2026, 0, 1))).toBe(1)
  })
})

describe('time zones', () => {
  it('reports the calendar-day offset from the local zone', () => {
    const now = new Date()
    expect(Math.abs(timeZoneDayOffset(now, 'Pacific/Kiritimati'))).toBeLessThanOrEqual(1)
    expect(timeZoneDayOffset(now, Intl.DateTimeFormat().resolvedOptions().timeZone)).toBe(0)
  })

  it('labels a zone by its city', () => {
    expect(timeZoneCityLabel('America/Los_Angeles')).toBe('Los Angeles')
    expect(timeZoneCityLabel('UTC')).toBe('UTC')
  })
})
