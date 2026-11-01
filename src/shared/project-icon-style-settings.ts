export type ProjectIconStyle = 'pixel' | 'repository'

export type ProjectIconStyleSettings = {
  /** Pixel draws Cove's sprite in sidebar project headers; repository shows the stored repo icon. */
  projectIconStyle?: ProjectIconStyle
}
