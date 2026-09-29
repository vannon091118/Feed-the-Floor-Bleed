import type { BaseMonster } from '@floor/sim-core'
import type { Texture } from 'pixi.js'
import { drawingContext, hex, textureOf } from './canvas'
import { drawFace, drawShadow } from './face'

/**
 * Granulare Sprites je Basis-Monster.
 *
 * Das alte `actor-atlas` kennt drei Rollen (Held, Monster, Boss). Die Registry
 * führt zwanzig Basisarten, die sich im Kampf sichtbar unterscheiden sollen —
 * dafür bekommt jede Art eine eigene Textur, gezeichnet aus ihrer Palette und
 * ihren drei Elementen: viel Masse rund und schwer, viel Tempo schmal und
 * aufrecht, viel Härte kantig und gepanzert. Das Sprite ist damit eine
 * Ableitung des Genoms, keine zweite Wahrheit über die Art.
 */
const SIZE = 64
const cache = new Map<string, Texture>()

function elementTone(value: number, min: number, max: number): number {
  const span = max - min
  if (span <= 0) return 0.5
  return Math.max(0, Math.min(1, (value - min) / span))
}

function draw(monster: BaseMonster): Texture {
  const { canvas, ctx } = drawingContext(SIZE)
  const [body, head, accent] = monster.palette
  const hexes = [hex(body), hex(head), hex(accent)]
  const [mass, speed, hardness] = monster.elements.map((value) =>
    elementTone(value, 1000, 10000),
  )

  const x = SIZE / 2
  const foot = SIZE * 0.9
  const bulk = 0.34 + mass * 0.22
  const width = SIZE * bulk
  const height = SIZE * (0.4 + hardness * 0.22)
  // Ein schnelles Wesen steht aufrechter, ein schweres sitzt tiefer.
  const leanTilt = (speed - 0.5) * 0.18

  ctx.save()
  ctx.translate(x, foot)
  ctx.rotate(leanTilt)

  // Schatten unter dem Wesen, in der Translation wie der Rest der Zeichnung.
  drawShadow(ctx, 0, -height * 0.48, width * 0.62, height * 0.6)

  // Körper: die Silhouette folgt der Härte — rund bei weichen Arten,
  // kantig bei gepanzerten.
  ctx.fillStyle = hexes[0]
  ctx.beginPath()
  if (hardness > 0.62) {
    ctx.moveTo(-width * 0.5, foot)
    ctx.lineTo(-width * 0.42, -height)
    ctx.lineTo(width * 0.42, -height)
    ctx.lineTo(width * 0.5, foot)
    ctx.closePath()
  } else {
    ctx.ellipse(0, -height * 0.5, width * 0.5, height * 0.55, 0, 0, Math.PI * 2)
  }
  ctx.fill()

  // Rückenplatten: sichtbar nur bei hoher Härte, sonst zwei weiche Rücken.
  ctx.fillStyle = hexes[2]
  ctx.beginPath()
  const plates = hardness > 0.6 ? 3 : 2
  for (let i = 0; i < plates; i += 1) {
    const px = -width * 0.3 + (i * width * 0.6) / Math.max(1, plates - 1)
    ctx.moveTo(px, -height * 0.72)
    ctx.lineTo(px + width * 0.1, -height * 0.98)
    ctx.lineTo(px + width * 0.2, -height * 0.72)
  }
  ctx.fill()

  // Kopf mit Augen: sitzt nach Tempo höher, ist nach Masse breiter. Die
  // Gesichtzeichnung selbst teilt sich mit dem Basis-Actor (siehe `face.ts`).
  drawFace(ctx, {
    x: 0,
    y: -height * (0.98 + speed * 0.1),
    radiusX: width * (0.3 + mass * 0.1),
    radiusY: height * 0.22,
    headColor: hexes[1],
  })

  ctx.restore()
  return textureOf(canvas)
}

/** Die Textur einer Basisart. Wird pro ID gecacht. */
export function baseMonsterTexture(monster: BaseMonster): Texture {
  const cached = cache.get(monster.id)
  if (cached) return cached
  const texture = draw(monster)
  cache.set(monster.id, texture)
  return texture
}
