import { type Container, Sprite, type Texture } from 'pixi.js'

/** Sichtbarkeit und Abbau eines Blattes in einer Ebene. */
interface Owned {
  setVisible(visible: boolean): void
  dispose(): void
}

export interface LayerSprite extends Owned {
  sprite: Sprite
}

/**
 * Dasselbe für ein Blatt, das kein einfacher `Sprite` ist: Das Editorraster
 * trägt einen `TilingSprite`. Beide Wege nutzen `disposeOwned`, damit die
 * Lebensdauerlogik an einer Stelle steht und nicht je Aufrufer abgeschrieben
 * wird — der Redundancy-Gate meldet zu Recht, wenn sie es zweimal gibt.
 */
export interface OwnedContainerSprite extends Owned {
  sprite: Container
}

function disposeOwned(sprite: Container): Owned {
  return {
    setVisible: (visible) => {
      sprite.visible = visible
    },
    dispose() {
      sprite.parent?.removeChild(sprite)
      sprite.destroy()
    },
  }
}

/** Legt ein Blatt in eine Ebene und besitzt Sichtbarkeit und Abbau. */
export function addLayerSprite(
  layer: Container,
  texture: Texture,
): LayerSprite {
  const sprite = new Sprite(texture)
  layer.addChild(sprite)
  return { sprite, ...disposeOwned(sprite) }
}

/** Nimmt ein fertiges Blatt in die Ebene und besitzt Sichtbarkeit und Abbau. */
export function ownLayerSprite(
  layer: Container,
  sprite: Container,
): OwnedContainerSprite {
  layer.addChild(sprite)
  return { sprite, ...disposeOwned(sprite) }
}
