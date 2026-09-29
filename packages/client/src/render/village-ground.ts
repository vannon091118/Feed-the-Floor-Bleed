import { type Container, Sprite, type Texture, TilingSprite } from 'pixi.js'
import { villageTexture } from './village-atlas'
import {
  VILLAGE_TREES,
  VILLAGE_WORLD_HEIGHT,
  VILLAGE_WORLD_WIDTH,
} from './village-layout'

/**
 * Der unbewegliche Dorfuntergrund: Wiese, Bodenkacheln, Weg und Bäume.
 *
 * Die Dorfszene zerfällt in zwei Teile, und dies ist der, der sich nie ändert:
 * Was an derselben Stelle liegen bleibt, zeichnet dieses Modul; was anklickbar
 * ist oder läuft, bleibt in `village-scene.ts`. Der Schnitt ist keine Kosmetik,
 * sondern schafft der Szene den Platz, den sie für die Verdrahtung des
 * Dorfbestands braucht: Sie stand bei 149 von 150 erlaubten Codelinien.
 *
 * `placeSprite` steht hier und nicht in der Szene, weil beide Teile sie
 * brauchen. Ein Fußpunkt-Anker, die ausdrückliche Breite und Höhe und die
 * ausdrücklich übergebene Tiefe sind für Boden, Baum, Gebäude und Bewohner
 * dieselbe Anlage; eine zweite Kopie daneben wäre eine zweite Wahrheit, die
 * auseinanderlaufen könnte, ohne dass ein Gate etwas merkte.
 */

/** Wie weit die Wiese über das Weltrechteck hinausreicht. */
const BACKDROP_SPAN = 4

/**
 * Die Texturen, die der Untergrund liest.
 *
 * Der Untergrund braucht nur Wiese und Baum. Der Typ steht deshalb hier und
 * nicht in der Szene: Ein Import zurück in die Szene ergäbe einen Zyklus, und
 * die Szene reicht ihre größere Texturmenge strukturell durch.
 */
export interface VillageGroundTextures {
  ground?: Texture
  tree?: Texture
}

/**
 * Legt einen Sprite mit Fußpunkt-Anker in eine Ebene.
 *
 * Der Anker liegt unten mittig: Die übergebene `y` ist der Standpunkt auf dem
 * Boden und nicht die obere Kante. Die Tiefe kommt ausdrücklich herein, statt
 * aus der Höhe gerechnet zu werden — die Szene leitet sie aus dem Fußpunkt ab,
 * und was weiter unten steht, liegt näher an der Kamera.
 */
export function placeSprite(
  parent: Container,
  texture: Texture,
  x: number,
  y: number,
  width: number,
  height: number,
  depth: number,
): Sprite {
  const sprite = new Sprite(texture)
  sprite.anchor.set(0.5, 1)
  sprite.position.set(x, y)
  sprite.width = width
  sprite.height = height
  sprite.zIndex = depth
  parent.addChild(sprite)
  return sprite
}

/**
 * Zeichnet Wiese, Bodenkacheln, Weg und Bäume in genau dieser Reihenfolge.
 *
 * Die Reihenfolge ist Zeichenreihenfolge und deshalb Verhalten, kein Detail:
 * Die Bodenschleife und die Baumliste legen ihre Kinder in fester Folge an, und
 * die Szene hängt danach Gebäude und Bewohner an. Wer hier umsortiert, verschiebt
 * die Tiefenlage des ganzen Dorfbilds.
 *
 * Die Wiese ist die Kachel der Variante 0, getönt und über das Vierfache des
 * Weltrechtecks gespannt, damit ein breiter Viewport keinen schwarzen Rand
 * sieht. Die Bodenebene läuft in 32er-Schritten über das Weltrechteck und färbt
 * die Variante 0 nach, der Weg liegt als 24 Pixel hoher Streifen darauf. Fehlt
 * eine lokale Grafik, kommt die prozedurale Textur derselben Variante zum
 * Einsatz; es gibt keinen versteckten Standardwert für ein fehlendes Bild, nur
 * diesen einen Rückfall.
 */
export function drawVillageGround(
  container: Container,
  textures: VillageGroundTextures,
): void {
  const backdrop = new TilingSprite({
    texture: textures.ground ?? villageTexture.ground(0),
    width: VILLAGE_WORLD_WIDTH * BACKDROP_SPAN,
    height: VILLAGE_WORLD_HEIGHT * BACKDROP_SPAN,
    tileScale: { x: 0.5, y: 0.5 },
  })
  backdrop.anchor.set(0.5)
  backdrop.position.set(VILLAGE_WORLD_WIDTH / 2, VILLAGE_WORLD_HEIGHT / 2)
  backdrop.tint = 0x7c9a62
  backdrop.zIndex = -100
  container.addChild(backdrop)

  for (let y = 0; y < VILLAGE_WORLD_HEIGHT; y += 32) {
    for (let x = 0; x < VILLAGE_WORLD_WIDTH; x += 32) {
      const variant = variantAt(x, y)
      const tile = placeSprite(
        container,
        textures.ground ?? villageTexture.ground(variant),
        x + 16,
        y + 32,
        32,
        32,
        y,
      )
      if (variant === 0) tile.tint = 0x9cbe78
    }
  }

  const pathY = 345
  for (let x = 80; x <= 920; x += 32) {
    const path = placeSprite(
      container,
      textures.ground ?? villageTexture.ground(variantAt(x, pathY)),
      x,
      pathY,
      32,
      24,
      pathY + 1,
    )
    path.tint = 0xc9ad77
  }

  for (const tree of VILLAGE_TREES) {
    placeSprite(
      container,
      textures.tree ?? villageTexture.tree(),
      tree.x,
      tree.y,
      32,
      48,
      tree.y,
    )
  }
}

/**
 * Die Bodenvariante einer Kachelposition.
 *
 * Beide Divisoren sind ganzzahlige Vielfache der Kachelgröße, weil der Boden in
 * 32er-Schritten läuft; das doppelte Modulo hält das Ergebnis auch für eine
 * negative Lage zwischen 0 und 7. Die Formel hängt allein von der Zelle ab und
 * ist damit reproduzierbar, ohne Zustand und ohne Zufall.
 */
function variantAt(x: number, y: number): number {
  return ((((x / 32) * 7 + (y / 32) * 11) % 8) + 8) % 8
}
