/**
 * Temporärer Beleg: Was erzeugt die Gold-Route-Füllung (0xffd35b, Alpha 0.18)
 * auf dem realen Mittelton jedes Bodenmaterials? Läuft einmalig, kommt nicht
 * ins Repository — Beleg, kein Feature.
 */
import { readFileSync } from 'node:fs'
import { inflateSync } from 'node:zlib'
import { fileURLToPath } from 'node:url'
import { dirname, join } from 'node:path'

const root = join(dirname(fileURLToPath(import.meta.url)), '..', 'public', 'assets')

function decodePng(file) {
  const b = readFileSync(file)
  let w = 0
  let h = 0
  let i = 8
  const idat = []
  while (i + 8 <= b.length) {
    const len = b.readUInt32BE(i)
    const type = b.subarray(i + 4, i + 8).toString('ascii')
    if (type === 'IHDR') {
      w = b.readUInt32BE(i + 8)
      h = b.readUInt32BE(i + 12)
    }
    if (type === 'IDAT') idat.push(b.subarray(i + 8, i + 8 + len))
    i += 12 + len
  }
  const raw = inflateSync(Buffer.concat(idat))
  // Der Generator schreibt Filter 0 (None) pro Zeile: kein Unfiltern nötig.
  // Jeder Scanline-Offset ist w*4+1 (Filterbyte + 4 Kanäle pro Pixel).
  const stride = w * 4 + 1
  return { w, h, raw, stride }
}

/** Mittelton R/G/B über alle Pixel eines Blatts, direkt aus dem Raw-Buffer. */
function meanOf(raw, w, h, stride) {
  const sums = [0, 0, 0]
  for (let y = 0; y < h; y++) {
    for (let x = 0; x < w; x++) {
      const o = y * stride + 1 + x * 4
      sums[0] += raw[o]
      sums[1] += raw[o + 1]
      sums[2] += raw[o + 2]
    }
  }
  const n = w * h
  return sums.map((s) => Math.round(s / n))
}

const lum = (c) => 0.299 * c[0] + 0.587 * c[1] + 0.114 * c[2]
const overlay = (base, over, a) =>
  [0, 1, 2].map((c) => Math.round(base[c] * (1 - a) + over[c] * a))
const hex = (c) => '#' + c.map((v) => v.toString(16).padStart(2, '0')).join('')

const GOLD = [0xff, 0xd3, 0x5b]
const STONE_EDGE = [0xe7, 0xd6, 0xb9]

for (const name of ['stone', 'soil', 'wood', 'moss', 'arcane']) {
  const { raw, w, h, stride } = decodePng(join(root, `dungeon_floor_${name}.png`))
  const mean = meanOf(raw, w, h, stride)
  const route = overlay(mean, GOLD, 0.18)
  const wall = overlay(mean, STONE_EDGE, 0.42)
  console.log(
    `${name.padEnd(7)} base=${hex(mean)} L=${lum(mean).toFixed(1)}  | ` +
      `+RouteGold =${hex(route)} ΔL=+${(lum(route) - lum(mean)).toFixed(1)} | ` +
      `+WandStroke =${hex(wall)} ΔL=+${(lum(wall) - lum(mean)).toFixed(1)}`,
  )
}
