export const SIDEBAR_TOGGLE_TRANSITION_MS = 200
export const SIDEBAR_TOGGLE_TRANSITION_EASING = 'cubic-bezier(0.2, 0, 0, 1)'

let transitionEndsAt = 0

export function beginSidebarToggleTransition(): void {
  transitionEndsAt = performance.now() + SIDEBAR_TOGGLE_TRANSITION_MS
}

export function endSidebarToggleTransition(): void {
  transitionEndsAt = 0
}

// Terminal fits wait for this so an animated sidebar sends one PTY resize, not one per frame.
export function sidebarToggleTransitionRemainingMs(): number {
  return Math.max(0, transitionEndsAt - performance.now())
}

export function prefersReducedMotion(): boolean {
  return window.matchMedia?.('(prefers-reduced-motion: reduce)').matches === true
}
