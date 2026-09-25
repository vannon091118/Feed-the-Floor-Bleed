import { Sprite } from 'pixi.js'
import { vignetteTexture } from './atlas'
import type { VisualRuntime } from './runtime'

export interface LightingView {
  resize(width: number, height: number): void
  dispose(): void
}

/** Dunkle Ränder als billige Lichtwirkung; kein Per-Pixel-Licht. */
export function createLightingView(runtime: VisualRuntime): LightingView {
  const sprite = new Sprite(vignetteTexture())
  sprite.anchor.set(0)
  runtime.layers.overlay.addChild(sprite)

  const resize = (width: number, height: number): void => {
    sprite.width = width
    sprite.height = height
  }
  resize(runtime.camera.viewportWidth, runtime.camera.viewportHeight)

  return {
    resize,
    dispose() {
      sprite.parent?.removeChild(sprite)
      sprite.destroy()
    },
  }
}
