import { createContext, useContext, useEffect, useRef, useState, type RefObject } from 'react'
import { useAppStore } from '@/store'

const DISARMED: RefObject<boolean> = { current: false }

/** True once its tab strip has committed with the session restored; tabs mounting after that were just created. */
export const TabStripEntranceContext = createContext<RefObject<boolean>>(DISARMED)

export function useTabStripEntranceArming(): RefObject<boolean> {
  const armedRef = useRef(false)
  const sessionReady = useAppStore((s) => s.workspaceSessionReady)
  useEffect(() => {
    armedRef.current = sessionReady
  }, [sessionReady])
  return armedRef
}

/** Decided once at mount so drag reorder and later re-renders never replay the entrance. */
export function useTabEntersStrip(): boolean {
  const armedRef = useContext(TabStripEntranceContext)
  const [enters] = useState(() => armedRef.current)
  return enters
}
