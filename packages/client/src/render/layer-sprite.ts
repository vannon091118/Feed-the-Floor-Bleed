import { type Container, Sprite, type Texture } from 'pixi.js'

export interface LayerSprite {
  sprite: Sprite
  setVisible(visible: boolean): void
  dispose(): void
}

/** Legt einen Sprite in eine Ebene und besitzt Sichtbarkeit und Abbau. */
export function addLayerSprite(
  layer: Container,
  texture: Texture,
): LayerSprite {
  const sprite = new Sprite(texture)
  layer.addChild(sprite)
  return {
    sprite,
    setVisible: (visible) => {
      sprite.visible = visible
    },
    dispose() {
      sprite.parent?.removeChild(sprite)
      sprite.destroy()
    },
  }
}
