export type WindowMaterial = 'solid' | 'glass'

export type WindowMaterialSettings = {
  /** Glass renders the shell translucent over a backdrop in the renderer; no native vibrancy. */
  windowMaterial?: WindowMaterial
}
