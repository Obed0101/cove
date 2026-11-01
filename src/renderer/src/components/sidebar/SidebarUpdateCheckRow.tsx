import React from 'react'
import { Loader2, RotateCw } from 'lucide-react'
import { useAppStore } from '@/store'
import { translate } from '@/i18n/i18n'
import { getUpdateCheckClickOptions, getUpdateCheckHint } from '@/lib/update-check-click-options'
import { cn } from '@/lib/utils'
import type { UpdateStatus } from '../../../../shared/update-status-types'
import {
  UPDATE_CHECK_NOTE_MS,
  updateCheckNote,
  type UpdateCheckNote
} from './sidebar-update-check-note'

function getUpdateStatusLabel(status: UpdateStatus, installedVersion: string | null): string {
  if (status.state === 'available' || status.state === 'downloaded') {
    return `v${status.version}`
  }
  if (status.state === 'downloading') {
    return `${Math.round(status.percent)}%`
  }
  return installedVersion ? `v${installedVersion}` : ''
}

// Cove: the sidebar footer keeps update checks one click away, like the design preview.
export function SidebarUpdateCheckRow(): React.JSX.Element {
  const updateStatus = useAppStore((s) => s.updateStatus)
  const [installedVersion, setInstalledVersion] = React.useState<string | null>(null)
  const busy = updateStatus.state === 'checking' || updateStatus.state === 'downloading'

  React.useEffect(() => {
    let cancelled = false
    void window.api.updater.getVersion().then((version) => {
      if (!cancelled) {
        setInstalledVersion(version)
      }
    })
    return () => {
      cancelled = true
    }
  }, [])

  // Why: only checks started here get a result note; background checks stay quiet.
  const awaitingResultRef = React.useRef(false)
  const [note, setNote] = React.useState<UpdateCheckNote | null>(null)

  React.useEffect(() => {
    if (!awaitingResultRef.current || updateStatus.state === 'checking') {
      return
    }
    awaitingResultRef.current = false
    setNote(updateCheckNote(updateStatus))
  }, [updateStatus])

  React.useEffect(() => {
    if (!note) {
      return
    }
    const timer = setTimeout(() => setNote(null), UPDATE_CHECK_NOTE_MS)
    return () => clearTimeout(timer)
  }, [note])

  const handleClick = (event: React.MouseEvent<HTMLButtonElement>): void => {
    awaitingResultRef.current = true
    setNote(null)
    void window.api.updater.check(getUpdateCheckClickOptions(event))
  }

  return (
    <div className="flex flex-col">
      <button
        type="button"
        disabled={busy}
        onClick={handleClick}
        title={getUpdateCheckHint()}
        className="flex min-h-9 w-full items-center gap-2 rounded-lg bg-worktree-sidebar-accent px-2.5 py-2 text-left text-[13px] font-medium text-muted-foreground transition-colors hover:bg-worktree-sidebar-foreground/10 disabled:cursor-default"
      >
        {updateStatus.state === 'checking' ? (
          <Loader2 className="size-4 shrink-0 animate-spin text-muted-foreground" />
        ) : (
          <RotateCw className="size-4 shrink-0 text-muted-foreground" />
        )}
        <span className="min-w-0 flex-1 truncate">
          {translate('auto.components.sidebar.SidebarUpdateCheckRow.label', 'Check for updates')}
        </span>
        <span className="shrink-0 text-xs font-normal tabular-nums text-muted-foreground">
          {getUpdateStatusLabel(updateStatus, installedVersion)}
        </span>
      </button>
      <p
        role="status"
        className={cn(
          'px-2.5 text-xs',
          note && 'pt-1',
          note?.tone === 'error' ? 'text-destructive' : 'text-muted-foreground'
        )}
      >
        {note?.text}
      </p>
    </div>
  )
}
