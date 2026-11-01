import React, { useCallback, useEffect, useLayoutEffect, useRef, useState } from 'react'
import { SYNC_FIT_PANES_EVENT } from '@/constants/terminal'
import {
  SIDEBAR_TOGGLE_TRANSITION_EASING,
  SIDEBAR_TOGGLE_TRANSITION_MS,
  beginSidebarToggleTransition,
  endSidebarToggleTransition,
  prefersReducedMotion
} from '@/lib/sidebar-toggle-transition'

type UseSidebarResizeOptions = {
  isOpen: boolean
  width: number
  minWidth: number
  maxWidth: number
  deltaSign: 1 | -1
  renderedExtraWidth?: number
  setWidth: (width: number) => void
  onDraftWidthChange?: (width: number) => void
  /** Animate width when isOpen flips; contentOpen stays true until the close animation ends. */
  animateToggle?: boolean
}

type UseSidebarResizeResult<T extends HTMLElement> = {
  containerRef: React.RefObject<T | null>
  isResizing: boolean
  onResizeStart: (event: React.MouseEvent) => void
  contentOpen: boolean
}

export function clampSidebarResizeWidth(width: number, minWidth: number, maxWidth: number): number {
  return Math.min(maxWidth, Math.max(minWidth, width))
}

export function getRenderedSidebarWidthCssValue(
  isOpen: boolean,
  width: number,
  renderedExtraWidth: number
): string {
  return isOpen ? `${width + renderedExtraWidth}px` : '0px'
}

export function getNextSidebarResizeWidth({
  clientX,
  startX,
  startWidth,
  deltaSign,
  minWidth,
  maxWidth
}: {
  clientX: number
  startX: number
  startWidth: number
  deltaSign: 1 | -1
  minWidth: number
  maxWidth: number
}): number {
  const delta = (clientX - startX) * deltaSign
  return clampSidebarResizeWidth(startWidth + delta, minWidth, maxWidth)
}

export function useSidebarResize<T extends HTMLElement>({
  isOpen,
  width,
  minWidth,
  maxWidth,
  deltaSign,
  renderedExtraWidth = 0,
  setWidth,
  onDraftWidthChange,
  animateToggle = false
}: UseSidebarResizeOptions): UseSidebarResizeResult<T> {
  const containerRef = useRef<T | null>(null)
  const isResizingRef = useRef(false)
  const startXRef = useRef(0)
  const startWidthRef = useRef(width)
  const draftWidthRef = useRef(width)
  const frameRef = useRef<number | null>(null)
  const overlayRef = useRef<HTMLDivElement | null>(null)
  const [isResizing, setIsResizing] = useState(false)
  const previousIsOpenRef = useRef(isOpen)
  const toggleTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null)
  const [contentOpen, setContentOpen] = useState(isOpen)
  if (isOpen && !contentOpen) {
    setContentOpen(true)
  }

  const removeDragOverlay = useCallback(() => {
    const overlay = overlayRef.current
    if (overlay && overlay.parentNode) {
      overlay.parentNode.removeChild(overlay)
    }
    overlayRef.current = null
  }, [])

  const resetDocumentStyles = useCallback(() => {
    document.body.style.cursor = ''
    document.body.style.userSelect = ''
    removeDragOverlay()
  }, [removeDragOverlay])

  const applyRenderedWidth = useCallback(
    (nextWidth: number) => {
      const container = containerRef.current
      if (!container) {
        return
      }

      // Keep live drag width out of React props so unrelated renders cannot reset it to the persisted width.
      container.style.width = getRenderedSidebarWidthCssValue(isOpen, nextWidth, renderedExtraWidth)
    },
    [isOpen, renderedExtraWidth]
  )

  useLayoutEffect(() => {
    if (isResizingRef.current) {
      return
    }

    const toggled = previousIsOpenRef.current !== isOpen
    previousIsOpenRef.current = isOpen
    const container = containerRef.current
    if (toggled && container) {
      if (animateToggle && !prefersReducedMotion()) {
        startToggleTransition(container, width, toggleTimerRef, () => {
          if (!isOpen) {
            setContentOpen(false)
          }
        })
      } else if (!isOpen) {
        setContentOpen(false)
      }
    }

    draftWidthRef.current = width
    applyRenderedWidth(width)
    onDraftWidthChange?.(width)
  }, [animateToggle, applyRenderedWidth, isOpen, onDraftWidthChange, width])

  useEffect(
    () => () => {
      if (toggleTimerRef.current !== null) {
        clearTimeout(toggleTimerRef.current)
      }
    },
    []
  )

  const stopResize = useCallback(() => {
    if (!isResizingRef.current) {
      return
    }

    isResizingRef.current = false
    setIsResizing(false)

    if (frameRef.current !== null) {
      cancelAnimationFrame(frameRef.current)
      frameRef.current = null
    }

    resetDocumentStyles()

    const finalWidth = draftWidthRef.current
    applyRenderedWidth(finalWidth)
    onDraftWidthChange?.(finalWidth)
    if (finalWidth !== width) {
      setWidth(finalWidth)
    }
  }, [applyRenderedWidth, onDraftWidthChange, resetDocumentStyles, setWidth, width])

  const handleMouseMove = useCallback(
    (event: MouseEvent) => {
      if (!isResizingRef.current) {
        return
      }

      const nextWidth = getNextSidebarResizeWidth({
        clientX: event.clientX,
        startX: startXRef.current,
        startWidth: startWidthRef.current,
        deltaSign,
        minWidth,
        maxWidth
      })
      if (nextWidth === draftWidthRef.current) {
        return
      }

      draftWidthRef.current = nextWidth
      if (frameRef.current !== null) {
        return
      }

      frameRef.current = window.requestAnimationFrame(() => {
        frameRef.current = null
        applyRenderedWidth(draftWidthRef.current)
        onDraftWidthChange?.(draftWidthRef.current)
      })
    },
    [applyRenderedWidth, deltaSign, maxWidth, minWidth, onDraftWidthChange]
  )

  useEffect(() => {
    window.addEventListener('mousemove', handleMouseMove)
    window.addEventListener('mouseup', stopResize)
    window.addEventListener('blur', stopResize)

    return () => {
      window.removeEventListener('mousemove', handleMouseMove)
      window.removeEventListener('mouseup', stopResize)
      window.removeEventListener('blur', stopResize)

      if (frameRef.current !== null) {
        cancelAnimationFrame(frameRef.current)
        frameRef.current = null
      }

      isResizingRef.current = false
      resetDocumentStyles()
    }
  }, [handleMouseMove, resetDocumentStyles, stopResize])

  const onResizeStart = useCallback(
    (event: React.MouseEvent) => {
      event.preventDefault()
      isResizingRef.current = true
      setIsResizing(true)
      startXRef.current = event.clientX
      startWidthRef.current = width
      draftWidthRef.current = width
      onDraftWidthChange?.(width)
      document.body.style.cursor = 'col-resize'
      document.body.style.userSelect = 'none'

      // A viewport overlay captures mouseup over native plugins such as PDF embeds, preventing a stuck resize.
      if (!overlayRef.current) {
        const overlay = document.createElement('div')
        overlay.style.position = 'fixed'
        overlay.style.inset = '0'
        overlay.style.zIndex = '2147483647'
        overlay.style.cursor = 'col-resize'
        overlay.style.background = 'transparent'
        document.body.appendChild(overlay)
        overlayRef.current = overlay
      }
    },
    [onDraftWidthChange, width]
  )

  return { containerRef, isResizing, onResizeStart, contentOpen }
}

// Cove: the container animates its width while children keep the open width, so the edge reveals them instead of reflowing every frame.
function startToggleTransition(
  container: HTMLElement,
  openWidth: number,
  timerRef: React.RefObject<ReturnType<typeof setTimeout> | null>,
  onFinish: () => void
): void {
  if (timerRef.current !== null) {
    clearTimeout(timerRef.current)
  }
  beginSidebarToggleTransition()
  container.style.transition = `width ${SIDEBAR_TOGGLE_TRANSITION_MS}ms ${SIDEBAR_TOGGLE_TRANSITION_EASING}`
  // Commit the pre-toggle width as the transition's start value before the caller sets the new one.
  void getComputedStyle(container).width
  container.style.setProperty('--sidebar-open-width', `${openWidth}px`)
  container.dataset.sidebarAnimating = ''
  timerRef.current = setTimeout(() => {
    timerRef.current = null
    container.style.transition = ''
    delete container.dataset.sidebarAnimating
    endSidebarToggleTransition()
    onFinish()
    window.dispatchEvent(new CustomEvent(SYNC_FIT_PANES_EVENT))
  }, SIDEBAR_TOGGLE_TRANSITION_MS)
}
