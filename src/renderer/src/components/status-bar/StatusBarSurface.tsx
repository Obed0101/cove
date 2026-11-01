import { PanelsTopLeft, Plus } from 'lucide-react'
import React from 'react'
import { useTranslation } from 'react-i18next'
import { lazyWithRetry } from '@/lib/lazy-with-retry'
import { Tooltip, TooltipContent, TooltipTrigger } from '@/components/ui/tooltip'
import { translate } from '@/i18n/i18n'
import { shouldOpenStatusBarContextMenu } from './status-bar-context-menu-policy'
import { StatusBarUsageCluster } from './StatusBarUsageCluster'
import { UpdateStatusSegment } from './UpdateStatusSegment'
import { SkillUpdateStatusSegment } from './SkillUpdateStatusSegment'
import { NativeChatResumeStatusSegment } from './NativeChatResumeStatusSegment'
import { CaffeinateStatusSegment } from './CaffeinateStatusSegment'
import { RemoteServerUpdateStatusSegment } from './RemoteServerUpdateStatusSegment'
import { TOGGLE_FLOATING_TERMINAL_EVENT } from '@/lib/floating-terminal'
import { FloatingTerminalIconContextMenu } from '@/components/floating-terminal/FloatingTerminalIconContextMenu'
import { CLOSE_ALL_CONTEXT_MENUS_EVENT } from '@/lib/close-all-context-menus'
import { useStatusBarController } from './use-status-bar-controller'
import { StatusBarVisibilityMenu } from './StatusBarVisibilityMenu'
import { isPairedWebClientWindow } from '@/lib/desktop-window-chrome'
import { useCoveConfigSnapshot } from '@/lib/cove-config-sync'
import type {
  CoveFooterAlign,
  CoveFooterWidgetId
} from '../../../../shared/cove-config/cove-config-schema'
import { PersonalClockSegment, readClockVisible, saveClockVisible } from './PersonalClockSegment'
import { PersonalFocusSegment } from './PersonalFocusSegment'
import { PersonalNoteSegment } from './PersonalNoteSegment'
import { PersonalWeatherSegment } from './PersonalWeatherSegment'
import {
  readPersonalWidgetVisible,
  savePersonalWidgetVisible,
  type OptInPersonalWidget
} from './personal-widget-visibility'
import { useCoveFooterLayout } from './use-cove-footer-layout'
import { useFooterWidgetEntrance } from './use-footer-widget-entrance'
import { handleStatusBarArrowKey } from './status-bar-roving-focus'
import { cn } from '@/lib/utils'

const PetStatusSegment = lazyWithRetry(() =>
  import('./PetStatusSegment').then((module) => ({ default: module.PetStatusSegment }))
)
const ResourceUsageStatusSegment = lazyWithRetry(() =>
  import('./ResourceUsageStatusSegment').then((module) => ({
    default: module.ResourceUsageStatusSegment
  }))
)
const PortsStatusSegment = lazyWithRetry(() =>
  import('./PortsStatusSegment').then((module) => ({ default: module.PortsStatusSegment }))
)
const SshStatusSegment = lazyWithRetry(() =>
  import('./SshStatusSegment').then((module) => ({ default: module.SshStatusSegment }))
)

// Why: zones scroll only once even the tightest density overflows, so attention segments never vanish.
const FOOTER_ZONE_CLASS =
  'flex min-w-0 items-center gap-2 data-[overflowing=true]:overflow-x-auto data-[overflowing=true]:scrollbar-none'

export type StatusBarProps = {
  floatingTerminalOpen: boolean
}

export function StatusBarSurface({
  floatingTerminalOpen
}: StatusBarProps): React.JSX.Element | null {
  // Memoized labels still need to follow language changes.
  useTranslation()
  const [weatherVisible, setWeatherVisible] = React.useState(() =>
    readPersonalWidgetVisible('weather')
  )
  const [clockVisible, setClockVisible] = React.useState(readClockVisible)
  const [focusVisible, setFocusVisible] = React.useState(() => readPersonalWidgetVisible('focus'))
  const [noteVisible, setNoteVisible] = React.useState(() => readPersonalWidgetVisible('note'))
  const coveConfig = useCoveConfigSnapshot().config
  const controller = useStatusBarController(
    floatingTerminalOpen,
    // Why: any layout change can move widgets between zones, so cached density widths no longer hold.
    `${weatherVisible}:${clockVisible}:${focusVisible}:${noteVisible}:${JSON.stringify(coveConfig.footer ?? null)}`
  )
  const petOn = controller?.petEnabled ?? false
  const floatingTerminalOn = controller?.showFloatingTerminalToggle ?? false
  const resourcesOn = controller?.showResourceUsage ?? false
  const portsOn = controller?.showPorts ?? false
  const hostsOn = controller?.showSsh ?? false
  const inAppVisible = React.useMemo(
    () => ({
      weather: weatherVisible,
      clock: clockVisible,
      focus: focusVisible,
      note: noteVisible,
      usage: true,
      'keep-awake': true,
      updates: true,
      pet: petOn,
      resources: resourcesOn,
      ports: portsOn,
      hosts: hostsOn,
      'floating-terminal': floatingTerminalOn
    }),
    [
      weatherVisible,
      clockVisible,
      focusVisible,
      noteVisible,
      petOn,
      resourcesOn,
      portsOn,
      hostsOn,
      floatingTerminalOn
    ]
  )
  // Why: these need their feature turned on; listing them in the file alone has nothing to render.
  const available = React.useMemo(
    () => ({
      'keep-awake': !isPairedWebClientWindow(),
      pet: petOn,
      'floating-terminal': floatingTerminalOn
    }),
    [petOn, floatingTerminalOn]
  )
  const footerLayout = useCoveFooterLayout({ inAppVisible, available })
  const isEnteringWidget = useFooterWidgetEntrance(
    footerLayout.rendered.map((slot) => slot.id),
    controller !== null
  )
  if (!controller) {
    return null
  }
  const {
    barRef,
    compact,
    floatingTerminalActionLabel,
    floatingTerminalShortcut,
    overflowing,
    segmentsIconOnly,
    setMenuOpen,
    setMenuPoint,
    showFloatingWorkspaceAttentionDot,
    usageRef
  } = controller

  // Personal widgets give way first at compact density; the rest keep their place and shrink to icons.
  const widgetContent: Record<Exclude<CoveFooterWidgetId, 'usage'>, React.ReactNode> = {
    weather: compact ? null : <PersonalWeatherSegment />,
    clock: compact ? null : <PersonalClockSegment />,
    focus: compact ? null : <PersonalFocusSegment />,
    note: compact ? null : <PersonalNoteSegment />,
    'keep-awake': <CaffeinateStatusSegment iconOnly={segmentsIconOnly} />,
    updates: (
      <>
        <RemoteServerUpdateStatusSegment iconOnly={segmentsIconOnly} />
        <SkillUpdateStatusSegment iconOnly={segmentsIconOnly} />
        <NativeChatResumeStatusSegment iconOnly={segmentsIconOnly} />
        <UpdateStatusSegment compact={compact} iconOnly={segmentsIconOnly} />
      </>
    ),
    pet: (
      <React.Suspense fallback={null}>
        <PetStatusSegment />
      </React.Suspense>
    ),
    resources: (
      <React.Suspense fallback={null}>
        <ResourceUsageStatusSegment compact={compact} iconOnly={segmentsIconOnly} />
      </React.Suspense>
    ),
    ports: (
      <React.Suspense fallback={null}>
        <PortsStatusSegment compact={compact} iconOnly={segmentsIconOnly} />
      </React.Suspense>
    ),
    hosts: (
      <React.Suspense fallback={null}>
        <SshStatusSegment compact={compact} iconOnly={segmentsIconOnly} />
      </React.Suspense>
    ),
    'floating-terminal': (
      <FloatingTerminalIconContextMenu currentLocation="status-bar" className="relative">
        <Tooltip>
          <TooltipTrigger asChild>
            <button
              type="button"
              className="relative inline-flex size-5 cursor-pointer items-center justify-center rounded-md border border-border/60 bg-card text-card-foreground transition-colors hover:bg-accent hover:text-accent-foreground"
              aria-label={
                showFloatingWorkspaceAttentionDot
                  ? translate(
                      'auto.components.status.bar.StatusBar.floatingTerminalNewActivity',
                      '{{label}}, new activity',
                      { label: floatingTerminalActionLabel }
                    )
                  : floatingTerminalActionLabel
              }
              onClick={() => {
                window.dispatchEvent(new CustomEvent(TOGGLE_FLOATING_TERMINAL_EVENT))
              }}
            >
              <PanelsTopLeft className="size-3.5" />
              {showFloatingWorkspaceAttentionDot ? (
                // Why: amber = Orca's "needs attention" convention; ring matches the fill so the dot reads on the icon.
                <span
                  aria-hidden
                  data-floating-terminal-attention
                  className="pointer-events-none absolute right-0.5 top-0.5 size-1.5 rounded-full bg-amber-500 ring-1 ring-secondary"
                />
              ) : null}
            </button>
          </TooltipTrigger>
          <TooltipContent side="top" sideOffset={6}>
            {floatingTerminalActionLabel} ({floatingTerminalShortcut})
          </TooltipContent>
        </Tooltip>
      </FloatingTerminalIconContextMenu>
    )
  }

  const renderZone = (align: CoveFooterAlign): React.ReactNode[] =>
    footerLayout.rendered
      .filter((slot) => slot.align === align)
      .map(({ id }) =>
        id === 'usage' ? (
          // Why: usage gives way first — what it drops stays one click away in its popover.
          <div
            key={id}
            data-footer-widget={id}
            className={cn(
              'status-bar-usage-cluster flex min-w-0 items-center overflow-clip [overflow-clip-margin:3px]',
              isEnteringWidget(id) && 'cove-footer-widget-in'
            )}
            data-overflowing={overflowing}
          >
            <div ref={usageRef} className="flex shrink-0 items-center gap-2">
              <StatusBarUsageCluster controller={controller} />
            </div>
          </div>
        ) : (
          <div
            key={id}
            data-footer-widget={id}
            data-footer-fixed
            className={cn(
              'flex shrink-0 items-center gap-2 empty:hidden',
              isEnteringWidget(id) && 'cove-footer-widget-in'
            )}
          >
            {widgetContent[id]}
          </div>
        )
      )
  const startZone = renderZone('start')
  const centerZone = renderZone('center')
  const endZone = renderZone('end')

  return (
    <div
      ref={barRef}
      role="toolbar"
      aria-label={translate('statusBar.toolbar', 'Status bar')}
      onKeyDown={handleStatusBarArrowKey}
      // Why: one line at any width — density steps down first. overflow-clip (not hidden) so focus can't scroll the bar; the clip margin spares focus rings and badge dots.
      // Cove: 30px widget strip in muted 11px type, matching the design preview's footer.
      className="flex items-center h-[30px] min-h-[30px] px-1 gap-2 overflow-clip [overflow-clip-margin:3px] whitespace-nowrap bg-shell text-muted-foreground text-[11px] select-none shrink-0 relative"
      onContextMenuCapture={(event) => {
        if (!shouldOpenStatusBarContextMenu(event.target)) {
          return
        }
        // Close peer menus and anchor at the cursor so repeated right-clicks reposition the menu.
        event.preventDefault()
        window.dispatchEvent(new Event(CLOSE_ALL_CONTEXT_MENUS_EVENT))
        const bounds = event.currentTarget.getBoundingClientRect()
        setMenuPoint({ x: event.clientX - bounds.left, y: event.clientY - bounds.top })
        setMenuOpen(true)
      }}
    >
      {startZone.length > 0 ? (
        <div data-footer-zone="start" data-overflowing={overflowing} className={FOOTER_ZONE_CLASS}>
          {startZone}
        </div>
      ) : null}
      {centerZone.length > 0 || endZone.length > 0 ? (
        <div aria-hidden className="min-w-0 flex-1" />
      ) : null}
      {centerZone.length > 0 ? (
        <div data-footer-zone="center" data-overflowing={overflowing} className={FOOTER_ZONE_CLASS}>
          {centerZone}
        </div>
      ) : null}
      {centerZone.length > 0 ? <div aria-hidden className="min-w-0 flex-1" /> : null}
      {endZone.length > 0 ? (
        <div data-footer-zone="end" data-overflowing={overflowing} className={FOOTER_ZONE_CLASS}>
          {endZone}
        </div>
      ) : null}

      <Tooltip>
        <TooltipTrigger asChild>
          <button
            type="button"
            data-footer-fixed
            className="ml-auto inline-flex shrink-0 items-center justify-center rounded-md p-1.5 transition-colors hover:bg-accent/70 hover:text-foreground"
            aria-label={translate(
              'auto.components.status.bar.StatusBar.customizeWidgets',
              'Customize widgets'
            )}
            onClick={(event) => {
              // Anchor the shared visibility menu above this button, as right-click does at the cursor.
              setMenuPoint({ x: event.currentTarget.offsetLeft, y: event.currentTarget.offsetTop })
              setMenuOpen(true)
            }}
          >
            <Plus className="size-[13px]" />
          </button>
        </TooltipTrigger>
        <TooltipContent side="top" sideOffset={6}>
          {translate('auto.components.status.bar.StatusBar.customizeWidgets', 'Customize widgets')}
        </TooltipContent>
      </Tooltip>

      <StatusBarVisibilityMenu
        controller={controller}
        footerLayout={footerLayout}
        clockVisible={footerLayout.isWidgetVisible('clock')}
        onClockVisibleChange={(visible) =>
          footerLayout.setWidgetVisible('clock', visible, () => {
            setClockVisible(visible)
            saveClockVisible(visible)
          })
        }
        weatherVisible={footerLayout.isWidgetVisible('weather')}
        focusVisible={footerLayout.isWidgetVisible('focus')}
        noteVisible={footerLayout.isWidgetVisible('note')}
        onPersonalWidgetVisibleChange={(widget: OptInPersonalWidget, visible: boolean) =>
          footerLayout.setWidgetVisible(widget, visible, () => {
            if (widget === 'weather') {
              setWeatherVisible(visible)
            } else if (widget === 'focus') {
              setFocusVisible(visible)
            } else {
              setNoteVisible(visible)
            }
            savePersonalWidgetVisible(widget, visible)
          })
        }
      />
    </div>
  )
}
