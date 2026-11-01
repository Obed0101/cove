import { Activity, Clock, FileIcon, Plug, Server, Sun, Timer } from 'lucide-react'
import React from 'react'
import {
  DropdownMenu,
  DropdownMenuCheckboxItem,
  DropdownMenuContent,
  DropdownMenuLabel,
  DropdownMenuRadioGroup,
  DropdownMenuRadioItem,
  DropdownMenuSeparator,
  DropdownMenuSub,
  DropdownMenuSubContent,
  DropdownMenuSubTrigger,
  DropdownMenuTrigger
} from '@/components/ui/dropdown-menu'
import { AgentIcon } from '@/lib/agent-catalog'
import { ClaudeIcon, GeminiIcon, MiniMaxIcon, OpenAIIcon, OpenCodeGoIcon } from './icons'
import { translate } from '@/i18n/i18n'
import { isStatusBarItemAvailable } from './status-bar-agent-gating'
import type { OptInPersonalWidget } from './personal-widget-visibility'
import type { StatusBarController } from './use-status-bar-controller'
import type { CoveFooterLayout } from './use-cove-footer-layout'
import type { StatusBarItem } from '../../../../shared/ui-chrome-types'
import {
  COVE_FOOTER_ALIGNS,
  type CoveFooterAlign,
  type CoveFooterWidgetId
} from '../../../../shared/cove-config/cove-config-schema'

type UsageMenuEntry = {
  provider: StatusBarItem
  /** Providers that can report usage without a detected CLI skip the PATH gate. */
  requiresCli: boolean
  icon: React.ReactNode
  label: () => string
}

const USAGE_MENU_ENTRIES: readonly UsageMenuEntry[] = [
  {
    provider: 'claude',
    requiresCli: true,
    icon: <ClaudeIcon size={14} />,
    label: () => translate('auto.components.status.bar.StatusBar.3885eb74d8', 'Claude Usage')
  },
  {
    provider: 'codex',
    requiresCli: true,
    icon: <OpenAIIcon size={14} />,
    label: () => translate('auto.components.status.bar.StatusBar.c0909c686e', 'Codex Usage')
  },
  {
    provider: 'gemini',
    requiresCli: true,
    icon: <GeminiIcon size={14} />,
    label: () => translate('auto.components.status.bar.StatusBar.c1df0d67ec', 'Gemini Usage')
  },
  {
    provider: 'antigravity',
    requiresCli: true,
    icon: <AgentIcon agent="antigravity" size={14} />,
    label: () =>
      translate('auto.components.status.bar.StatusBar.antigravityUsage', 'Antigravity Usage')
  },
  {
    provider: 'opencode-go',
    requiresCli: false,
    icon: <OpenCodeGoIcon size={14} />,
    label: () => translate('auto.components.status.bar.StatusBar.8c86cd77b0', 'OpenCode Go Usage')
  },
  {
    provider: 'kimi',
    requiresCli: true,
    icon: <AgentIcon agent="kimi" size={14} />,
    label: () => translate('auto.components.status.bar.StatusBar.5e59007df4', 'Kimi Usage')
  },
  {
    provider: 'minimax',
    requiresCli: false,
    icon: <MiniMaxIcon size={14} />,
    label: () => translate('auto.components.status.bar.StatusBar.3bbf140864', 'MiniMax Usage')
  },
  {
    provider: 'grok',
    requiresCli: true,
    icon: <AgentIcon agent="grok" size={14} />,
    label: () => translate('auto.components.status.bar.StatusBar.grokUsageMenu', 'Grok Usage')
  },
  {
    provider: 'zcode',
    requiresCli: true,
    icon: <AgentIcon agent="zcode" size={14} />,
    label: () => translate('auto.components.status.bar.StatusBar.zcodeUsageMenu', 'ZCode Usage')
  },
  {
    provider: 'cursor',
    requiresCli: false,
    icon: <AgentIcon agent="cursor" size={14} />,
    label: () => translate('auto.components.status.bar.StatusBar.cursorUsageMenu', 'Cursor Usage')
  }
]

function footerWidgetLabel(id: CoveFooterWidgetId): string {
  switch (id) {
    case 'weather':
      return translate('statusBar.weather', 'Weather')
    case 'clock':
      return translate('statusBar.localClock', 'Local clock')
    case 'focus':
      return translate('statusBar.focusTimer', 'Focus timer')
    case 'note':
      return translate('statusBar.quickNote', 'Quick note')
    case 'usage':
      return translate('auto.components.status.bar.UsageRosterPanel.title', 'Usage')
    case 'keep-awake':
      return translate('statusBar.keepAwake', 'Keep awake')
    case 'updates':
      return translate('statusBar.updates', 'Updates')
    case 'pet':
      return translate('statusBar.pet', 'Pet')
    case 'resources':
      return translate('auto.components.status.bar.StatusBar.d1e1a7a6bf', 'Resource Manager')
    case 'ports':
      return translate('auto.components.status.bar.StatusBar.9659e38343', 'Ports')
    case 'hosts':
      return translate('auto.components.status.bar.StatusBar.24ac89df1a', 'Remote Hosts')
    case 'floating-terminal':
      return translate('statusBar.floatingTerminal', 'Floating terminal')
  }
}

function footerAlignLabel(align: CoveFooterAlign): string {
  switch (align) {
    case 'start':
      return translate('statusBar.alignStart', 'Left')
    case 'center':
      return translate('statusBar.alignCenter', 'Center')
    case 'end':
      return translate('statusBar.alignEnd', 'Right')
  }
}

export function StatusBarVisibilityMenu({
  controller,
  footerLayout,
  clockVisible,
  onClockVisibleChange,
  weatherVisible,
  focusVisible,
  noteVisible,
  onPersonalWidgetVisibleChange
}: {
  controller: StatusBarController
  footerLayout: CoveFooterLayout
  clockVisible: boolean
  onClockVisibleChange: (visible: boolean) => void
  weatherVisible: boolean
  focusVisible: boolean
  noteVisible: boolean
  onPersonalWidgetVisibleChange: (widget: OptInPersonalWidget, visible: boolean) => void
}): React.JSX.Element {
  const {
    detectedAgentIds,
    menuOpen,
    menuPoint,
    recordFeatureInteraction,
    setMenuOpen,
    statusBarItems,
    toggleStatusBarItem
  } = controller

  const segmentItem = (
    widget: CoveFooterWidgetId,
    item: StatusBarItem,
    feature: 'ssh' | 'resource-manager' | 'ports',
    icon: React.ReactNode
  ): React.JSX.Element => (
    <DropdownMenuCheckboxItem
      checked={footerLayout.isWidgetVisible(widget)}
      onCheckedChange={(visible) => {
        recordFeatureInteraction(feature)
        footerLayout.setWidgetVisible(widget, visible, () => toggleStatusBarItem(item))
      }}
    >
      {icon}
      {footerWidgetLabel(widget)}
    </DropdownMenuCheckboxItem>
  )

  return (
    <DropdownMenu open={menuOpen} onOpenChange={setMenuOpen} modal={false}>
      <DropdownMenuTrigger asChild>
        <button
          aria-hidden
          tabIndex={-1}
          className="pointer-events-none absolute size-px opacity-0"
          style={{ left: menuPoint.x, top: menuPoint.y }}
        />
      </DropdownMenuTrigger>
      <DropdownMenuContent className="min-w-0 w-fit" sideOffset={0} align="start">
        <DropdownMenuLabel className="text-xs font-semibold text-foreground">
          {translate('statusBar.footerWidgets', 'Footer widgets')}
        </DropdownMenuLabel>
        <DropdownMenuCheckboxItem
          checked={weatherVisible}
          onCheckedChange={(visible) => onPersonalWidgetVisibleChange('weather', visible)}
        >
          <Sun className="size-3.5" />
          {footerWidgetLabel('weather')}
        </DropdownMenuCheckboxItem>
        <DropdownMenuCheckboxItem checked={clockVisible} onCheckedChange={onClockVisibleChange}>
          <Clock className="size-3.5" />
          {footerWidgetLabel('clock')}
        </DropdownMenuCheckboxItem>
        <DropdownMenuCheckboxItem
          checked={focusVisible}
          onCheckedChange={(visible) => onPersonalWidgetVisibleChange('focus', visible)}
        >
          <Timer className="size-3.5" />
          {footerWidgetLabel('focus')}
        </DropdownMenuCheckboxItem>
        <DropdownMenuCheckboxItem
          checked={noteVisible}
          onCheckedChange={(visible) => onPersonalWidgetVisibleChange('note', visible)}
        >
          <FileIcon className="size-3.5" />
          {footerWidgetLabel('note')}
        </DropdownMenuCheckboxItem>
        {USAGE_MENU_ENTRIES.filter(
          (entry) =>
            !entry.requiresCli || isStatusBarItemAvailable(entry.provider, detectedAgentIds)
        ).map((entry) => (
          <DropdownMenuCheckboxItem
            key={entry.provider}
            checked={statusBarItems.includes(entry.provider)}
            onCheckedChange={() => {
              recordFeatureInteraction('usage-tracking')
              footerLayout.toggleUsageProvider(entry.provider, () =>
                toggleStatusBarItem(entry.provider)
              )
            }}
          >
            {entry.icon}
            {entry.label()}
          </DropdownMenuCheckboxItem>
        ))}
        {segmentItem('hosts', 'ssh', 'ssh', <Server className="size-3.5" />)}
        {segmentItem(
          'resources',
          'resource-usage',
          'resource-manager',
          <Activity className="size-3.5" />
        )}
        {segmentItem('ports', 'ports', 'ports', <Plug className="size-3.5" />)}
        {footerLayout.rendered.length > 0 ? (
          <>
            <DropdownMenuSeparator />
            <DropdownMenuSub>
              <DropdownMenuSubTrigger>
                {translate('statusBar.widgetPosition', 'Position')}
              </DropdownMenuSubTrigger>
              <DropdownMenuSubContent className="min-w-0 w-fit">
                {footerLayout.rendered.map((slot) => (
                  <DropdownMenuSub key={slot.id}>
                    <DropdownMenuSubTrigger className="gap-6">
                      <span className="flex-1">{footerWidgetLabel(slot.id)}</span>
                      <span className="text-muted-foreground">{footerAlignLabel(slot.align)}</span>
                    </DropdownMenuSubTrigger>
                    <DropdownMenuSubContent className="min-w-0 w-fit">
                      <DropdownMenuRadioGroup
                        value={slot.align}
                        onValueChange={(value) => {
                          const align = COVE_FOOTER_ALIGNS.find((option) => option === value)
                          if (align) {
                            footerLayout.setWidgetAlign(slot.id, align)
                          }
                        }}
                      >
                        {COVE_FOOTER_ALIGNS.map((align) => (
                          <DropdownMenuRadioItem key={align} value={align}>
                            {footerAlignLabel(align)}
                          </DropdownMenuRadioItem>
                        ))}
                      </DropdownMenuRadioGroup>
                    </DropdownMenuSubContent>
                  </DropdownMenuSub>
                ))}
              </DropdownMenuSubContent>
            </DropdownMenuSub>
          </>
        ) : null}
      </DropdownMenuContent>
    </DropdownMenu>
  )
}
