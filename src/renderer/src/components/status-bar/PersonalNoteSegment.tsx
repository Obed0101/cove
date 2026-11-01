import { FileIcon, X } from 'lucide-react'
import { useRef, useState } from 'react'
import { Button } from '@/components/ui/button'
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover'
import { Textarea } from '@/components/ui/textarea'
import { translate } from '@/i18n/i18n'
import { STATUS_BAR_CONTEXT_MENU_EXEMPT_PROPS } from './status-bar-context-menu-policy'

const QUICK_NOTE_KEY = 'orca.status-bar.quick-note.v1'
const QUICK_NOTE_MAX_LENGTH = 4000

function readQuickNote(): string {
  try {
    return localStorage.getItem(QUICK_NOTE_KEY) ?? ''
  } catch {
    return ''
  }
}

function saveQuickNote(note: string): void {
  try {
    if (note) {
      localStorage.setItem(QUICK_NOTE_KEY, note)
    } else {
      localStorage.removeItem(QUICK_NOTE_KEY)
    }
  } catch {
    // Keep the current session usable if device storage is unavailable.
  }
}

export function PersonalNoteSegment(): React.JSX.Element {
  const [open, setOpen] = useState(false)
  const [note, setNote] = useState(readQuickNote)
  const textareaRef = useRef<HTMLTextAreaElement>(null)
  const title = translate('statusBar.quickNote', 'Quick note')

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <button
          type="button"
          aria-label={
            note
              ? translate('statusBar.quickNoteWithContent', 'Quick note, has content')
              : undefined
          }
          className="inline-flex items-center gap-1.5 rounded-md px-2 py-[3px] transition-colors hover:bg-accent/70 hover:text-foreground data-[state=open]:bg-accent/70 data-[state=open]:text-foreground"
        >
          <span className="relative inline-flex">
            <FileIcon className="size-[13px]" aria-hidden="true" />
            {note ? (
              <span
                data-quick-note-dot
                aria-hidden="true"
                className="absolute -right-0.5 -top-0.5 size-[6px] rounded-full bg-worktree-status-active ring-2 ring-shell"
              />
            ) : null}
          </span>
          <span>{title}</span>
        </button>
      </PopoverTrigger>
      <PopoverContent
        side="top"
        align="end"
        sideOffset={8}
        aria-label={title}
        {...STATUS_BAR_CONTEXT_MENU_EXEMPT_PROPS}
        className="w-[280px] max-w-[calc(100vw-2rem)] p-3"
        onOpenAutoFocus={(event) => {
          event.preventDefault()
          textareaRef.current?.focus()
        }}
      >
        <div className="mb-2 flex items-center gap-2">
          <h2 className="flex-1 text-xs font-semibold text-foreground">{title}</h2>
          <button
            type="button"
            aria-label={translate('statusBar.quickNoteClose', 'Close note')}
            onClick={() => setOpen(false)}
            className="inline-flex size-6 items-center justify-center rounded-md text-muted-foreground transition-colors hover:bg-accent/70 hover:text-foreground"
          >
            <X className="size-[13px]" aria-hidden="true" />
          </button>
        </div>
        <Textarea
          ref={textareaRef}
          aria-label={title}
          value={note}
          maxLength={QUICK_NOTE_MAX_LENGTH}
          placeholder={translate('statusBar.quickNotePlaceholder', 'Keep a thought here…')}
          onChange={(event) => {
            setNote(event.target.value)
            saveQuickNote(event.target.value)
          }}
          className="min-h-24 resize-y p-2 text-xs leading-normal md:text-xs"
        />
        <div className="mt-2 flex items-center gap-2 text-[11px] text-muted-foreground">
          <p className="min-w-0 flex-1 truncate">
            {translate('statusBar.quickNoteSaved', 'Saved on this device.')}
          </p>
          <span className="shrink-0 tabular-nums" aria-live="off">
            {note.length} / {QUICK_NOTE_MAX_LENGTH}
          </span>
          <Button
            type="button"
            variant="ghost"
            size="xs"
            disabled={!note}
            onClick={() => {
              setNote('')
              saveQuickNote('')
              textareaRef.current?.focus()
            }}
          >
            {translate('statusBar.quickNoteClear', 'Clear')}
          </Button>
        </div>
      </PopoverContent>
    </Popover>
  )
}
