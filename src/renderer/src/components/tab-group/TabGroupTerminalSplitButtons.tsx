import { Columns2, Rows2, type LucideIcon } from 'lucide-react'
import { Tooltip, TooltipContent, TooltipTrigger } from '@/components/ui/tooltip'
import { useShortcutLabel } from '@/hooks/useShortcutLabel'
import { translate } from '@/i18n/i18n'
import { requestActiveTerminalPaneSplit } from '../tab-bar/request-active-terminal-pane-split'

type SplitDirection = 'vertical' | 'horizontal'

function TerminalSplitButton({
  terminalTabId,
  direction,
  label,
  shortcut,
  Icon
}: {
  terminalTabId: string
  direction: SplitDirection
  label: string
  shortcut: string
  Icon: LucideIcon
}): React.JSX.Element {
  return (
    <Tooltip>
      <TooltipTrigger asChild>
        <button
          type="button"
          aria-label={label}
          onClick={() => requestActiveTerminalPaneSplit({ tabId: terminalTabId, direction })}
          className="my-auto flex size-7 shrink-0 items-center justify-center rounded-md text-muted-foreground hover:bg-accent/50 hover:text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent"
        >
          <Icon className="size-3.5" />
        </button>
      </TooltipTrigger>
      <TooltipContent side="bottom" sideOffset={6}>
        {label}
        {shortcut ? <span className="ml-1.5 text-background/60">{shortcut}</span> : null}
      </TooltipContent>
    </Tooltip>
  )
}

/** Cove: one-click terminal splits at the end of the pane header, like a multiplexer. */
export function TabGroupTerminalSplitButtons({
  terminalTabId
}: {
  terminalTabId: string
}): React.JSX.Element {
  const splitRightShortcut = useShortcutLabel('terminal.splitRight')
  const splitDownShortcut = useShortcutLabel('terminal.splitDown')
  return (
    <>
      <TerminalSplitButton
        terminalTabId={terminalTabId}
        direction="vertical"
        label={translate(
          'auto.components.tab.bar.SortableTabContextMenu.splitTerminalRight',
          'Split terminal right'
        )}
        shortcut={splitRightShortcut}
        Icon={Columns2}
      />
      <TerminalSplitButton
        terminalTabId={terminalTabId}
        direction="horizontal"
        label={translate(
          'auto.components.tab.bar.SortableTabContextMenu.splitTerminalDown',
          'Split terminal down'
        )}
        shortcut={splitDownShortcut}
        Icon={Rows2}
      />
    </>
  )
}
