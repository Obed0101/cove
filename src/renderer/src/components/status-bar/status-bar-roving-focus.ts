import type { KeyboardEvent } from 'react'

/** Index to focus after `key` in a toolbar of `count` items, wrapping at the ends; null when the key does not move focus. */
export function nextStatusBarFocusIndex(
  current: number,
  count: number,
  key: string
): number | null {
  if (count === 0) {
    return null
  }
  switch (key) {
    case 'ArrowRight':
      return current < 0 ? 0 : (current + 1) % count
    case 'ArrowLeft':
      return current < 0 ? count - 1 : (current - 1 + count) % count
    case 'Home':
      return 0
    case 'End':
      return count - 1
    default:
      return null
  }
}

function isTextEntry(element: Element): boolean {
  return (
    element instanceof HTMLInputElement ||
    element instanceof HTMLTextAreaElement ||
    (element instanceof HTMLElement && element.isContentEditable)
  )
}

/** Moves focus between the bar's enabled, rendered buttons in DOM (visual) order. */
export function handleStatusBarArrowKey(event: KeyboardEvent<HTMLElement>): void {
  const bar = event.currentTarget
  const target = event.target
  // Why: popover content is portaled; its key events bubble through React but are not inside the bar.
  if (!(target instanceof Element) || !bar.contains(target) || isTextEntry(target)) {
    return
  }
  if (event.altKey || event.ctrlKey || event.metaKey || event.shiftKey) {
    return
  }
  const buttons = Array.from(
    bar.querySelectorAll<HTMLButtonElement>('button:not([disabled])')
  ).filter((button) => button.getClientRects().length > 0)
  const current = buttons.findIndex((button) => button === target || button.contains(target))
  const next = nextStatusBarFocusIndex(current, buttons.length, event.key)
  if (next === null) {
    return
  }
  event.preventDefault()
  buttons[next]?.focus()
}
