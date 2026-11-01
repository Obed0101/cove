import {
  COVE_FOOTER_WIDGET_IDS,
  type CoveConfig,
  type CoveFooterAlign,
  type CoveFooterWidgetId
} from './cove-config-schema'

export type CoveFooterSlot = { id: CoveFooterWidgetId; align: CoveFooterAlign }

export type CoveFooterWidgetEntry = { id: CoveFooterWidgetId; align?: CoveFooterAlign }

/** The file's list when it declares one; otherwise every in-app-visible widget on the left, in default order. */
export function resolveCoveFooterLayout(
  config: CoveConfig,
  isVisibleInApp: (id: CoveFooterWidgetId) => boolean
): CoveFooterSlot[] {
  const declared = config.footer?.widgets
  if (declared) {
    return declared.map((widget) => ({ id: widget.id, align: widget.align ?? 'start' }))
  }
  return COVE_FOOTER_WIDGET_IDS.filter(isVisibleInApp).map((id) => ({ id, align: 'start' }))
}

export function isCoveFooterDeclared(config: CoveConfig): boolean {
  return config.footer?.widgets !== undefined
}

export function withCoveFooterWidgetVisible(
  layout: readonly CoveFooterSlot[],
  id: CoveFooterWidgetId,
  visible: boolean
): CoveFooterSlot[] {
  const present = layout.some((slot) => slot.id === id)
  if (visible === present) {
    return [...layout]
  }
  if (!visible) {
    return layout.filter((slot) => slot.id !== id)
  }
  // Keep the default order among left-aligned widgets so a re-shown widget returns to its usual place.
  const rank = (widget: CoveFooterWidgetId): number => COVE_FOOTER_WIDGET_IDS.indexOf(widget)
  const insertAt = layout.findIndex((slot) => slot.align === 'start' && rank(slot.id) > rank(id))
  const next = [...layout]
  next.splice(insertAt === -1 ? next.length : insertAt, 0, { id, align: 'start' })
  return next
}

export function withCoveFooterWidgetAlign(
  layout: readonly CoveFooterSlot[],
  id: CoveFooterWidgetId,
  align: CoveFooterAlign
): CoveFooterSlot[] {
  return layout.map((slot) => (slot.id === id ? { id, align } : slot))
}

export function toCoveFooterWidgetEntries(
  layout: readonly CoveFooterSlot[]
): CoveFooterWidgetEntry[] {
  return layout.map((slot) => (slot.align === 'start' ? { id: slot.id } : { ...slot }))
}
