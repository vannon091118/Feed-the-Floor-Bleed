import { createRng, mix, nextBelow, PALETTE } from './palette.mjs'
import { PixelBuffer } from './pixel-buffer.mjs'
import { baseTile, glints, grain } from './tile-shapes.mjs'

/**
 * Die Zeichner je Material.
 *
 * Jeder Materialzeichner bekommt den Farbkörper aus `palette.mjs`, einen
 * eigenen Seed und die Kachelmaße. Der gemeinsame Bausatz — Grundfläche, Fuge,
 * Körnung, Glanzpunkte — liegt in `tile-shapes.mjs`; hier steht nur, was das
 * Material vom Bausatz unterscheidet.
 */

/** Arcane: violettes Gitter über dunklem Grund, mit hellen Adern. */
function drawArcane(size, rng) {
  const buffer = new PixelBuffer(size, size)
  const colors = PALETTE.arcane
  // Die Fuge sitzt je Variante anders, damit der Boden beim Kacheln nicht als
  // durchgehende Reihe heller Streifen liest.
  const { base } = baseTile(buffer, colors, size, size / 2)
  grain(buffer, rng, colors.detail, 120, size, 85)

  // Das Gitter: zwei Teilbarkeiten, versetzt, in gedämpftem Violett. Es ist das,
  // was den Arcane-Boden auf den Referenzblättern von Stein unterscheidet.
  const step = size / 4
  for (let index = 1; index < 4; index += 1) {
    const position = Math.round(index * step)
    const vein = mix(colors.detail, base, 0.45)
    buffer.vLine(position, 1, size - 2, vein, 150)
    buffer.hLine(1, position, size - 2, vein, 150)
    // Aufgehellte Kante direkt daneben: gibt dem Gitter Tiefe ohne Weichzeichnen.
    buffer.vLine(position + 1, 1, size - 2, mix(vein, 0xffffff, 0.2), 80)
    buffer.hLine(1, position + 1, size - 2, mix(vein, 0xffffff, 0.2), 80)
  }

  // Helle Adern: kurze, unterbrochene Züge, die das Gitter auffächern.
  for (let index = 0; index < 5; index += 1) {
    const x = 3 + nextBelow(rng, size - 7)
    const y = 3 + nextBelow(rng, size - 7)
    const length = 2 + nextBelow(rng, 4)
    const bright = mix(colors.detail, 0xe8dcff, 0.6)
    for (let step = 0; step < length; step += 1) {
      buffer.px(x + step, y, bright, 190)
      if (step % 2 === 0) buffer.px(x + step, y + 1, bright, 110)
    }
  }
  glints(buffer, rng, 3, size, 0.3)
  return buffer
}

/** Stone: kühles Blaugrau, gebrochen von feinen Rissen und warmen Splittern. */
function drawStone(size, rng) {
  const buffer = new PixelBuffer(size, size)
  const colors = PALETTE.stone
  // `edge` trägt die Rissfarbe: Der Riss ist dunkler als die Fuge, sonst
  // verschmilzt er mit ihr und die Platte verliert ihre Tiefe.
  const { edge } = baseTile(buffer, colors, size, size / 2)
  grain(buffer, rng, colors.detail, 110, size, 75)

  // Risse: die Referenz zeigt sie als schmale, dunkle, leicht gezackte Züge.
  for (let crack = 0; crack < 3; crack += 1) {
    let x = 2 + nextBelow(rng, size - 4)
    let y = 2 + nextBelow(rng, size - 4)
    const length = 5 + nextBelow(rng, 7)
    const dark = mix(edge, 0x000000, 0.25)
    for (let step = 0; step < length; step += 1) {
      buffer.px(x, y, dark, 170)
      if (rng() > 0.55) buffer.px(x, y + 1, dark, 90)
      if (rng() > 0.7) x += rng() > 0.5 ? 1 : -1
      if (rng() > 0.75) y += 1
      if (x < 2 || x > size - 3) x = 2 + nextBelow(rng, size - 4)
      if (y < 2 || y > size - 3) break
    }
  }

  // Der Steinboden der Referenz trägt warme Goldsplitter: kleine, harte,
  // gesättigte Punkte. Sie sind das einzige Warme im sonst kalten Blau.
  glints(buffer, rng, 5, size, 0.55)
  return buffer
}

/** Wood: Dielen mit durchlaufender Fuge und Maserung längs. */
function drawWood(size, rng) {
  const buffer = new PixelBuffer(size, size)
  const colors = PALETTE.wood
  // `edge` trägt die Dielenfuge: Sie muss dunkler sein als jedes Brett, sonst
  // laufen die Bretter ineinander und der Boden verliert seine Tiefe.
  const { base, edge } = baseTile(buffer, colors, size, 0)
  grain(buffer, rng, colors.detail, 60, size, 50)

  // Dielen: zwei Fugen teilen die Kachel in drei Bretter, wie auf dem
  // Referenzblatt. Jedes Brett bekommt einen leicht anderen Grundton.
  const boardHeight = Math.round(size / 3)
  for (let board = 0; board < 3; board += 1) {
    const top = board * boardHeight
    const tone = mix(base, board % 2 === 0 ? 0xffffff : 0x000000, 0.07)
    buffer.fill(1, top + 1, size - 2, boardHeight - 1, tone)
    buffer.hLine(1, top, size - 2, mix(edge, 0x000000, 0.2), 190)
    buffer.hLine(1, top + 1, size - 2, mix(edge, colors.detail, 0.3), 80)
  }

  // Maserung: lange, flache Züge längs des Brettes, nie gekreuzt. Sie läuft
  // über die halbe bis ganze Diele — auf dem Referenzblatt ist sie der Grund,
  // warum Holz als Holz und nicht als brauner Streifen liest.
  for (let board = 0; board < 3; board += 1) {
    const top = board * boardHeight + 2
    const usable = boardHeight - 3
    for (let line = 0; line < 4; line += 1) {
      const y = top + nextBelow(rng, usable)
      const start = 1 + nextBelow(rng, 4)
      const length = size / 2 + nextBelow(rng, size / 2)
      // Zwei Töne: die Ader dunkel, darüber ein heller Rand. Das gibt Tiefe,
      // ohne zu weichzeichnen.
      const dark = mix(colors.edge, 0x000000, 0.1)
      const light = mix(colors.detail, 0xd8b184, 0.4)
      for (let step = 0; step < length; step += 1) {
        const x = start + step
        if (x > size - 2) break
        // Die Ader leicht wellen lassen, damit sie nicht als Messinglinie liest.
        const wave = step % 6 === 0 ? 1 : 0
        buffer.px(x, y + wave, dark, 120)
        buffer.px(x, y + wave + 1, light, 70)
      }
    }
  }
  glints(buffer, rng, 2, size, 0.25)
  return buffer
}

/** Soil: dunkle, weiche Erde — bewusst zurückhaltend, es ist der Standardboden. */
function drawSoil(size, rng) {
  const buffer = new PixelBuffer(size, size)
  const colors = PALETTE.soil
  baseTile(buffer, colors, size, 0)
  grain(buffer, rng, colors.detail, 110, size, 75)
  // Kleine Steine: zwei bis drei Pixel breite Klumpen, kein Rauschen.
  for (let stone = 0; stone < 5; stone += 1) {
    const x = 3 + nextBelow(rng, size - 6)
    const y = 3 + nextBelow(rng, size - 6)
    const tone = mix(colors.detail, 0x8a8275, rng() * 0.4)
    buffer.fill(x, y, 2, 1, tone, 150)
    buffer.px(x + 1, y + 1, mix(tone, 0x000000, 0.4), 110)
  }
  return buffer
}

/** Moss: gesättigtes Grün mit hellen Spitzen, die den Boden aufbrechen. */
function drawMoss(size, rng) {
  const buffer = new PixelBuffer(size, size)
  const colors = PALETTE.moss
  const { base } = baseTile(buffer, colors, size, 0)
  grain(buffer, rng, colors.detail, 100, size, 80)

  // Flecken: weiche, unregelmäßige Flächen statt Punkten. Auf den Referenzen
  // ist der Bewuchs das, was den Boden lebendig macht.
  for (let patch = 0; patch < 6; patch += 1) {
    const cx = 3 + nextBelow(rng, size - 6)
    const cy = 3 + nextBelow(rng, size - 6)
    const radius = 2 + nextBelow(rng, 4)
    const tone = mix(colors.detail, base, rng() * 0.5)
    for (let dy = -radius; dy <= radius; dy += 1) {
      for (let dx = -radius; dx <= radius; dx += 1) {
        if (dx * dx + dy * dy > radius * radius) continue
        buffer.px(cx + dx, cy + dy, tone, 150)
      }
    }
  }
  // Spitzen: einzelne helle Pixel, die aus den Flecken ragen.
  for (let tip = 0; tip < 14; tip += 1) {
    const x = 2 + nextBelow(rng, size - 4)
    const y = 2 + nextBelow(rng, size - 4)
    buffer.px(x, y, mix(colors.detail, 0xd8f0a8, 0.55), 190)
  }
  glints(buffer, rng, 2, size, 0.2)
  return buffer
}

const DRAWERS = {
  arcane: drawArcane,
  stone: drawStone,
  wood: drawWood,
  soil: drawSoil,
  moss: drawMoss,
}

/** Zeichnet eine Bodenkachel; `seed` macht Variante und Material eindeutig. */
export function drawFloor(materialId, variant, size) {
  const drawer = DRAWERS[materialId]
  if (!drawer) throw new Error(`kein Bodenzeichner für ${materialId}`)
  return drawer(size, createRng((variant * 2654435761) >>> 0))
}
