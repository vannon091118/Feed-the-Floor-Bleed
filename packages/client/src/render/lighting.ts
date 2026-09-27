import { vignetteTexture } from './atmosphere-atlas'
import { addLayerSprite } from './layer-sprite'
import type { VisualRuntime } from './runtime'

export interface LightingView {
  resize(width: number, height: number): void
  setVisible(visible: boolean): void
  dispose(): void
}

/** Dunkle Ränder als billige Lichtwirkung; kein Per-Pixel-Licht. */
export function createLightingView(runtime: VisualRuntime): LightingView {
  const vignette = addLayerSprite(runtime.layers.overlay, vignetteTexture())
  vignette.sprite.anchor.set(0)

  const resize = (width: number, height: number): void => {
    vignette.sprite.width = width
    vignette.sprite.height = height
  }
  resize(runtime.camera.viewportWidth, runtime.camera.viewportHeight)

  return { resize, setVisible: vignette.setVisible, dispose: vignette.dispose }
}
