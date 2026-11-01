import { useEffect, useRef } from 'react'

/**
 * Reports which footer widgets appeared after the first paint so only those animate in.
 * A widget that is hidden and shown again counts as appearing again.
 */
export function useFooterWidgetEntrance(
  renderedIds: readonly string[],
  ready: boolean
): (id: string) => boolean {
  const presentAtFirstPaintRef = useRef<Set<string> | null>(null)
  const idsKey = renderedIds.join('\n')

  useEffect(() => {
    if (!ready) {
      return
    }
    const current = new Set(idsKey.split('\n'))
    const initial = presentAtFirstPaintRef.current
    presentAtFirstPaintRef.current = initial
      ? new Set([...initial].filter((id) => current.has(id)))
      : current
  }, [idsKey, ready])

  return (id) => {
    const initial = presentAtFirstPaintRef.current
    return initial !== null && !initial.has(id)
  }
}
