import { describe, expect, it } from 'vitest'
import { nextStatusBarFocusIndex } from './status-bar-roving-focus'

describe('nextStatusBarFocusIndex', () => {
  it('moves one step and wraps at both ends', () => {
    expect(nextStatusBarFocusIndex(1, 4, 'ArrowRight')).toBe(2)
    expect(nextStatusBarFocusIndex(3, 4, 'ArrowRight')).toBe(0)
    expect(nextStatusBarFocusIndex(0, 4, 'ArrowLeft')).toBe(3)
  })

  it('jumps to the first and last item', () => {
    expect(nextStatusBarFocusIndex(2, 4, 'Home')).toBe(0)
    expect(nextStatusBarFocusIndex(0, 4, 'End')).toBe(3)
  })

  it('enters from outside the item list at the matching end', () => {
    expect(nextStatusBarFocusIndex(-1, 4, 'ArrowRight')).toBe(0)
    expect(nextStatusBarFocusIndex(-1, 4, 'ArrowLeft')).toBe(3)
  })

  it('leaves Tab, Enter and empty toolbars alone', () => {
    expect(nextStatusBarFocusIndex(1, 4, 'Tab')).toBeNull()
    expect(nextStatusBarFocusIndex(1, 4, 'Enter')).toBeNull()
    expect(nextStatusBarFocusIndex(0, 0, 'ArrowRight')).toBeNull()
  })
})
