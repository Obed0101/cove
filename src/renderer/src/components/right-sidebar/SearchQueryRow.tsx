import { ImeInput } from '@/lib/ime-text-field'
import React from 'react'
import { Search as SearchIcon, CaseSensitive, WholeWord, Regex, X, Loader2 } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { ToggleButton } from './SearchResultItems'
import { translate } from '@/i18n/i18n'
import {
  FILE_EXPLORER_QUERY_FIELD_CLASS_NAME,
  FILE_EXPLORER_QUERY_INPUT_CLASS_NAME
} from './file-explorer-query-field'

export type SearchQueryRowProps = {
  inputRef: React.Ref<HTMLInputElement>
  query: string
  loading: boolean
  caseSensitive: boolean
  wholeWord: boolean
  useRegex: boolean
  onQueryChange: (e: React.ChangeEvent<HTMLInputElement>) => void
  onKeyDown: (e: React.KeyboardEvent) => void
  onClearSearch: () => void
  onToggleCaseSensitive: () => void
  onToggleWholeWord: () => void
  onToggleRegex: () => void
}

export function SearchQueryRow({
  inputRef,
  query,
  loading,
  caseSensitive,
  wholeWord,
  useRegex,
  onQueryChange,
  onKeyDown,
  onClearSearch,
  onToggleCaseSensitive,
  onToggleWholeWord,
  onToggleRegex
}: SearchQueryRowProps): React.JSX.Element {
  return (
    <div className={FILE_EXPLORER_QUERY_FIELD_CLASS_NAME} data-ignore-file-explorer-keys="true">
      <SearchIcon className="size-4 shrink-0" strokeWidth={1.75} />
      <ImeInput
        ref={inputRef}
        type="text"
        data-file-search-input="true"
        data-explorer-query-input="search"
        className={FILE_EXPLORER_QUERY_INPUT_CLASS_NAME}
        aria-label={translate(
          'auto.components.right.sidebar.SearchQueryRow.queryLabel',
          'Search files'
        )}
        placeholder={translate('auto.components.right.sidebar.SearchHeader.693cbeadd0', 'Search')}
        value={query}
        onChange={onQueryChange}
        onKeyDown={onKeyDown}
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
            'auto.components.right.sidebar.SearchQueryRow.clearLabel',
            'Clear search'
          )}
          onClick={onClearSearch}
        >
          <X className="size-3" />
        </Button>
      ) : null}
      <ToggleButton
        active={caseSensitive}
        onClick={onToggleCaseSensitive}
        title={translate('auto.components.right.sidebar.SearchHeader.464ae3974f', 'Match Case')}
      >
        <CaseSensitive className="size-3.5" />
      </ToggleButton>
      <ToggleButton
        active={wholeWord}
        onClick={onToggleWholeWord}
        title={translate(
          'auto.components.right.sidebar.SearchHeader.4567e6e0b6',
          'Match Whole Word'
        )}
      >
        <WholeWord className="size-3.5" />
      </ToggleButton>
      <ToggleButton
        active={useRegex}
        onClick={onToggleRegex}
        title={translate(
          'auto.components.right.sidebar.SearchHeader.6234a5ef85',
          'Use Regular Expression'
        )}
      >
        <Regex className="size-3.5" />
      </ToggleButton>
    </div>
  )
}
