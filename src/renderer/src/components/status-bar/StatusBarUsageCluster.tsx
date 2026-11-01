import React from 'react'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuTrigger
} from '@/components/ui/dropdown-menu'
import { translate } from '@/i18n/i18n'
import { UsageRosterPanel } from './UsageRosterPanel'
import { STATUS_BAR_CONTEXT_MENU_EXEMPT_PROPS } from './status-bar-context-menu-policy'
import { StatusBarUsageEmptyCta } from './StatusBarUsageEmptyCta'
import { StatusBarUsageChangeNotices } from './StatusBarUsageChangeNotices'
import { ClaudeSwitcherMenu } from './ClaudeSwitcherMenu'
import { CodexSwitcherMenu } from './CodexSwitcherMenu'
import { ProviderDetailsMenu } from './ProviderDetailsMenu'
import { ProviderSegment, UsageOverflowChip, getUsageTone } from './StatusBarProviderSegment'
import {
  UsageUnitLabel,
  getUsageUnitLabelState,
  usageChipShowsPercentage
} from './usage-unit-label'
import { isOwnerNotSetUpPlaceholder } from './owner-usage-rate-limits'
import type { StatusBarController } from './use-status-bar-controller'

export function StatusBarUsageCluster({
  controller
}: {
  controller: StatusBarController
}): React.JSX.Element | null {
  const {
    anyFetching,
    canSignInFromUsageRow,
    collapseUsage,
    collapsedUsageProviders,
    compact,
    handleManageAccounts,
    handleOpenProviderAccounts,
    handleRefresh,
    handleUsageDetails,
    handleUsageMenuOpenChange,
    hasVisibleUsageMeters,
    isEmptyUsageState,
    isRefreshing,
    remoteOwner,
    rosterProviders,
    setStatusBarUsageMode,
    showEmptyUsageCta,
    statusBarUsageMode,
    usageMenuFocusHandoff,
    usageMenuOpen,
    usagePercentageDisplay,
    usageTightestOnly
  } = controller
  const usageMode = usageTightestOnly ? 'compact' : statusBarUsageMode
  const unitLabelState = getUsageUnitLabelState(rosterProviders, collapsedUsageProviders, usageMode)

  if (isEmptyUsageState) {
    return showEmptyUsageCta ? <StatusBarUsageEmptyCta remoteOwner={remoteOwner} /> : null
  }
  if (!hasVisibleUsageMeters) {
    return null
  }
  return (
    <StatusBarUsageChangeNotices hasVisibleUsageMeters={hasVisibleUsageMeters}>
      <DropdownMenu open={usageMenuOpen} onOpenChange={handleUsageMenuOpenChange} modal={false}>
        <DropdownMenuTrigger asChild>
          <button
            type="button"
            className="inline-flex items-center gap-6 rounded-md px-2 py-[3px] hover:bg-accent/70 hover:text-foreground data-[state=open]:bg-accent data-[state=open]:text-foreground"
            aria-label={translate('auto.components.status.bar.UsageRosterPanel.title', 'Usage')}
          >
            {/* Cove: "Used" is the implied reading; only the inverted display needs a unit. */}
            {unitLabelState !== 'absent' && usagePercentageDisplay !== 'used' ? (
              <UsageUnitLabel
                collapsed={unitLabelState === 'collapsed'}
                display={usagePercentageDisplay}
              />
            ) : null}
            {rosterProviders.map((p) => (
              // Why: collapsed chips leave the row but stay measurable, so the density hook can bring them back.
              <span
                key={p.provider}
                data-usage-chip={p.provider}
                data-usage-urgent={getUsageTone(p) === 'urgent'}
                data-usage-percentage={usageChipShowsPercentage(p, usageMode)}
                data-usage-collapsed={collapsedUsageProviders.includes(p.provider)}
                aria-hidden={collapsedUsageProviders.includes(p.provider)}
                className="inline-flex data-[usage-collapsed=true]:invisible data-[usage-collapsed=true]:absolute"
              >
                <ProviderSegment
                  p={p}
                  compact={compact}
                  display={usagePercentageDisplay}
                  mode={usageMode}
                />
              </span>
            ))}
            {collapseUsage ? (
              <UsageOverflowChip
                providerCount={rosterProviders.length}
                hidden={rosterProviders.filter((p) => collapsedUsageProviders.includes(p.provider))}
                display={usagePercentageDisplay}
              />
            ) : null}
          </button>
        </DropdownMenuTrigger>
        <DropdownMenuContent
          {...STATUS_BAR_CONTEXT_MENU_EXEMPT_PROPS}
          side="top"
          align="start"
          sideOffset={8}
          // Reserve footer height so the popover and drill-in submenus stay above the status bar.
          collisionPadding={{ top: 8, bottom: 32, left: 8, right: 8 }}
          className="w-[360px] p-0"
          onPointerDownOutside={usageMenuFocusHandoff.onPointerDownOutside}
          onCloseAutoFocus={usageMenuFocusHandoff.onCloseAutoFocus}
        >
          <UsageRosterPanel
            providers={rosterProviders}
            display={usagePercentageDisplay}
            statusBarUsageMode={statusBarUsageMode}
            onStatusBarUsageModeChange={setStatusBarUsageMode}
            isRefreshing={isRefreshing || anyFetching}
            onRefresh={handleRefresh}
            onOpenProvider={handleOpenProviderAccounts}
            onSignIn={handleOpenProviderAccounts}
            canSignIn={canSignInFromUsageRow}
            onManageAccounts={handleManageAccounts}
            onUsageDetails={handleUsageDetails}
            renderRow={(p, rowNode) => {
              // Why: a placeholder has nothing to drill into; its row opens the host's accounts.
              if (isOwnerNotSetUpPlaceholder(p)) {
                return null
              }
              // Claude/Codex detail panels also expose account switching and runtime controls.
              if (p.provider === 'claude') {
                return (
                  <ClaudeSwitcherMenu
                    claude={p}
                    compact={compact}
                    iconOnly={false}
                    asSubmenu
                    triggerContent={rowNode}
                  />
                )
              }
              if (p.provider === 'codex') {
                return (
                  <CodexSwitcherMenu
                    codex={p}
                    compact={compact}
                    iconOnly={false}
                    asSubmenu
                    triggerContent={rowNode}
                  />
                )
              }
              return (
                <ProviderDetailsMenu
                  provider={p}
                  compact={compact}
                  iconOnly={false}
                  asSubmenu
                  triggerContent={rowNode}
                  ariaLabel={translate(
                    'auto.components.status.bar.UsageRosterPanel.openDetails',
                    'Open usage details'
                  )}
                />
              )
            }}
          />
        </DropdownMenuContent>
      </DropdownMenu>
    </StatusBarUsageChangeNotices>
  )
}
