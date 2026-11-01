// @vitest-environment happy-dom
import { useState } from 'react'
import { cleanup, render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { afterEach, expect, it } from 'vitest'
import { FileExplorerQueryStrip } from './FileExplorerQueryStrip'
import { TooltipProvider } from '@/components/ui/tooltip'
import type { RightSidebarExplorerView } from '../../../../shared/ui-chrome-types'

afterEach(cleanup)

function QueryStrip(): React.JSX.Element {
  const [view, setView] = useState<RightSidebarExplorerView>('files')
  return (
    <TooltipProvider>
      <FileExplorerQueryStrip view={view} onSelectView={setView} actions={null}>
        <div hidden={view !== 'files'}>
          <input aria-label="Name query" data-explorer-query-input="files" />
        </div>
        <div hidden={view !== 'search'}>
          <input aria-label="Content query" data-explorer-query-input="search" />
        </div>
      </FileExplorerQueryStrip>
    </TooltipProvider>
  )
}

it('hands focused query input to the other mode in both directions and keeps each value', async () => {
  const user = userEvent.setup()
  render(<QueryStrip />)
  const names = screen.getByLabelText('Name query')
  const contents = screen.getByLabelText('Content query')
  const toggle = screen.getByRole('button', { name: 'Search file contents' })
  await user.type(names, 'filename')
  await user.click(toggle)
  expect(toggle.getAttribute('aria-pressed')).toBe('true')
  expect(document.activeElement).toBe(contents)
  expect(contents).toHaveProperty('value', '')
  await user.keyboard('contents')
  await user.click(toggle)
  expect(toggle.getAttribute('aria-pressed')).toBe('false')
  expect(document.activeElement).toBe(names)
  expect(names).toHaveProperty('value', 'filename')
  await user.click(toggle)
  expect(document.activeElement).toBe(contents)
  expect(contents).toHaveProperty('value', 'contents')
})

it('keeps focus on the toggle when switching modes from the keyboard', async () => {
  const user = userEvent.setup()
  render(<QueryStrip />)
  const toggle = screen.getByRole('button', { name: 'Search file contents' })
  toggle.focus()
  await user.keyboard(' ')
  expect(toggle.getAttribute('aria-pressed')).toBe('true')
  expect(document.activeElement).toBe(toggle)
})
