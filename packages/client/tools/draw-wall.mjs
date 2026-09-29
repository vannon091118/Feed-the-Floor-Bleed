import { mix, PALETTE, saturate, shift } from './palette.mjs'
import { PixelBuffer } from './pixel-buffer.mjs'
import { glints, grain } from './tile-shapes.mjs'

/**
 * Der Wandzeichner.
 *
 * Die Wand steht nicht im Materialzeichner, weil sie kein weiteres Material
 * ist: Sie hat eigene Maße, eine eigene Perspektive und eine eigene Aufgabe —
 * sie muss aus der Fläche einen Block machen, der Volumen hat.
 */

/**
 * Zeichnet eine Wandkachel: Deckplatte, Fassade und Seitenschatten.
 *
 * `height` ist die künstliche Höhe aus `world/tiles.ts` — derselbe Wert, mit dem
 * der Renderer das Sprite streckt. Die Zeichnung muss dazu passen, sonst steht
 * die Deckplatte nicht dort, wo der Sprite sie erwartet.
 */
export function drawWall(size, height, rng) {
  const buffer = new PixelBuffer(size, size + height)
  const colors = PALETTE.stone
  const base = saturate(colors.base, 0.82)
  const edge = mix(saturate(colors.edge, 0.9), 0x000000, 0.3)

  // Die oberen `height` Pixel tragen die Draufsicht, darunter steht die
  // Fassade. Beide brauchen eigene Behandlung: die Deckplatte fängt das Licht,
  // die Front liegt im eigenen Schatten. Ein Rahmen um beides ließe die
  // Deckplatte mit der Fassade verschmelzen.
  const deck = shift(mix(base, 0xffffff, 0.16), { value: 1.05 })
  const facade = shift(base, { value: 0.78 })
  const mortar = mix(edge, 0x000000, 0.2)

  buffer.fill(0, 0, size, size + height, edge)
  buffer.fill(1, 1, size - 2, height - 2, deck)
  buffer.fill(1, height, size - 2, size, facade)

  // Die Oberkante der Deckplatte: eine helle Kante, die die Platte als Kante
  // lesbar macht. Ohne sie verschwimmt der Blick zwischen oben und vorn.
  buffer.hLine(1, 1, size - 2, shift(mix(deck, 0xffffff, 0.35), { value: 1 }))
  // Der Schatten, den die Deckplatte auf die Fassade wirft — zwei Pixel, und
  // genau hier entscheidet sich, ob der Block Volumen hat.
  buffer.hLine(1, height, size - 2, mix(edge, 0x000000, 0.45))
  buffer.hLine(1, height + 1, size - 2, mix(facade, 0x000000, 0.3))

  // Quader auf der Fassade: versetzte Lagen mit dunkler Fuge. Auf der Referenz
  // tragen sie den Block; ohne sie steht da eine glatte Platte.
  const courseHeight = Math.round(size / 2)
  for (let row = 0; row < 2; row += 1) {
    const y = height + 4 + row * courseHeight
    if (y >= size + height - 2) break
    buffer.hLine(1, y, size - 2, mortar, 200)
    buffer.hLine(1, y + 1, size - 2, mix(mortar, facade, 0.45), 90)
    // Die Stoßfuge sitzt versetzt: auf der Referenz alternieren die Lagen.
    const offset = row === 0 ? 0 : Math.round(size / 3)
    for (let joint = offset; joint < size - 1; joint += Math.round(size / 2)) {
      buffer.vLine(joint, y, courseHeight, mortar, 170)
    }
  }

  // Seitenkanten: rechts der Schatten, links das Streiflicht. Zwei Pixel
  // Breite, weil ein einzelner Pixel bei dieser Skala verschwindet.
  buffer.fill(size - 2, height + 2, 2, size - 2, mix(edge, 0x000000, 0.4), 190)
  buffer.vLine(1, height + 2, size - 3, mix(facade, 0xffffff, 0.2), 110)

  // Der Fuß: die dunkelste Stelle des Blocks. Sie verankert ihn auf dem Boden,
  // und ohne sie schwebt die Wand über der Kachel darunter.
  buffer.hLine(1, size + height - 2, size - 2, mix(edge, 0x000000, 0.5), 220)
  buffer.hLine(1, size + height - 3, size - 2, mix(facade, 0x000000, 0.25), 140)

  grain(buffer, rng, colors.detail, 90, size, 60)
  glints(buffer, rng, 5, size, 0.4)
  return buffer
}
