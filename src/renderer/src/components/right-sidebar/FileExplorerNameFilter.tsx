import React from 'react'
import { Loader2, Search, X } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { translate } from '@/i18n/i18n'
import {
  FILE_EXPLORER_QUERY_FIELD_CLASS_NAME,
  FILE_EXPLORER_QUERY_INPUT_CLASS_NAME
} from './file-explorer-query-field'

type FileExplorerNameFilterProps = {
  query: string
  scopeLabel?: string
  loading?: boolean
  onQueryChange: (value: string) => void
  onClear: () => void
}

export function FileExplorerNameFilter({
  query,
  scopeLabel,
  loading = false,
  onQueryChange,
  onClear
}: FileExplorerNameFilterProps): React.JSX.Element {
  return (
    <div className={FILE_EXPLORER_QUERY_FIELD_CLASS_NAME} data-ignore-file-explorer-keys="true">
      <Search className="size-4 shrink-0" strokeWidth={1.75} />
      <input
        type="text"
        data-explorer-query-input="files"
        className={FILE_EXPLORER_QUERY_INPUT_CLASS_NAME}
        aria-label={translate(
          'auto.components.right.sidebar.FileExplorerNameFilter.26fb73c6e3',
          'Find files'
        )}
        placeholder={
          scopeLabel
            ? translate('fileExplorer.root.findInFolder', 'Find in {{path}}', { path: scopeLabel })
            : translate(
                'auto.components.right.sidebar.FileExplorerNameFilter.placeholder',
                'Find files…'
              )
        }
        value={query}
        onChange={(event) => onQueryChange(event.currentTarget.value)}
        spellCheck={false}
      />
      {loading ? <Loader2 className="size-3 shrink-0 animate-spin text-muted-foreground" /> : null}
      {query ? (
        <Button
          type="button"
          variant="ghost"
          size="icon-xs"
          className="h-auto w-auto rounded-sm p-0.5 text-muted-foreground hover:text-foreground"
          aria-label={translate(
            'auto.components.right.sidebar.FileExplorerNameFilter.4d5a6b2a49',
            'Clear file filter'
          )}
          onClick={onClear}
        >
          <X className="size-3" />
        </Button>
      ) : null}
    </div>
  )
}
