import { useAppStore } from '@/store'
import { DEFAULT_REPO_BADGE_COLOR } from '../../../../shared/constants'
import type { RepoIcon } from '../../../../shared/repo-icon'
import { RepoIconGlyph } from './repo-icon'

const PROJECT_SPRITES = [
  ['..#..#..', '..####..', '.######.', '##.##.##', '########', '.#.##.#.', '.#....#.', '##....##'],
  ['...##...', '..####..', '.######.', '##.##.##', '########', '..####..', '...##...', '..####..'],
  ['..####..', '.######.', '##.##.##', '########', '##.##.##', '########', '###..###', '.#.##.#.']
] as const

// Cove preview palette: --ok, --prompt and --git-modified.
const PROJECT_SPRITE_COLORS = [
  'var(--git-decoration-added)',
  'var(--callout-note)',
  'var(--git-decoration-modified)'
] as const

const PROJECT_SPRITE_CELLS = PROJECT_SPRITES.map((rows) =>
  rows.flatMap((row, y) => [...row].flatMap((cell, x) => (cell === '#' ? [{ x, y }] : [])))
)

export function ProjectPixelAvatar({
  index,
  color
}: {
  index: number
  color?: string
}): React.JSX.Element {
  const cells = PROJECT_SPRITE_CELLS[index % PROJECT_SPRITE_CELLS.length]
  return (
    <svg
      viewBox="0 0 8 8"
      aria-hidden="true"
      className="size-4 shrink-0"
      shapeRendering="crispEdges"
      fill={color ?? PROJECT_SPRITE_COLORS[index % PROJECT_SPRITE_COLORS.length]}
    >
      {cells.map(({ x, y }) => (
        <rect key={`${x}:${y}`} x={x} y={y} width={1} height={1} />
      ))}
    </svg>
  )
}

export function ProjectHeaderIcon({
  repoIcon,
  index,
  color
}: {
  repoIcon: RepoIcon | null | undefined
  index: number
  color?: string
}): React.JSX.Element {
  const iconStyle = useAppStore((s) => s.settings?.projectIconStyle ?? 'pixel')
  if (iconStyle === 'pixel') {
    // The neutral default badge would grey out every sprite; only a user-picked color overrides the palette.
    const pixelColor = color === DEFAULT_REPO_BADGE_COLOR ? undefined : color
    return <ProjectPixelAvatar index={index} color={pixelColor} />
  }
  return (
    <RepoIconGlyph repoIcon={repoIcon} color={color} className="size-4" iconClassName="size-3.5" />
  )
}
