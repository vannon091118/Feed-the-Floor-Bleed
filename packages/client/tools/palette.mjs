/**
 * Die Stilregeln des Generators.
 *
 * Sie stammen aus sechs Stilreferenzblättern des Auftraggebers (Arcane-Boden
 * mit violettem Gitter, Arcane-Mauer mit hellen Adern, Steinboden mit
 * Goldsplittern, Holzdielen, Steinmauer, Barbarensack). Diese Blätter sind
 * ausdrücklich **keine** Assets und kommen nicht ins Repository — E3 und E6
 * des Visual-Grundsatzes schließen das für. Was hier steht, ist die Übersetzung
 * dessen, was die Bilder zeigen, in Regeln, die Code schreiben kann.
 */

/** Farbkörper einer Materialfamilie, 0xRRGGBB. */
export const PALETTE = {
  arcane: { base: 0x3a2b5c, edge: 0x20153a, detail: 0x7358c9 },
  stone: { base: 0x6b6f76, edge: 0x3d4046, detail: 0x878c94 },
  wood: { base: 0x6a4a2c, edge: 0x3f2b17, detail: 0x8a6338 },
  soil: { base: 0x4a3b2a, edge: 0x2f2519, detail: 0x5c4a34 },
  moss: { base: 0x3f5a34, edge: 0x24351e, detail: 0x5a7a46 },
}

/** Der eine warme Glanzton, der in den Referenzen überall wiederkehrt. */
export const GLINT = 0xe0c27a

/**
 * Mulberry32, identisch zu `sim-core/src/prng`.
 *
 * Bewusst eine eigene Kopie: Das Werkzeug läuft als `.mjs` außerhalb des
 * Workspace und darf die Simulationsdomäne nicht importieren. Hier ist
 * Zufall Bildrauschen und ausdrücklich keine Spielregel — die Reproduzierbarkeit
 * ist dieselbe, die Regel ist es nicht.
 *
 * @param {number} seed
 * @returns {() => number} eine Folge in [0, 1)
 */
export function createRng(seed) {
  let state = seed >>> 0
  return function next() {
    state = (state + 0x6d2b79f5) >>> 0
    let value = state
    value = Math.imul(value ^ (value >>> 15), value | 1) >>> 0
    value =
      (value ^ (value + Math.imul(value ^ (value >>> 7), value | 61))) >>> 0
    state = value
    return ((value ^ (value >>> 14)) >>> 0) / 0x100000000
  }
}

/**
 * @param {() => number} rng
 * @param {number} bound
 * @returns {number} eine ganze Zahl in [0, bound)
 */
export function nextBelow(rng, bound) {
  return Math.floor(rng() * bound)
}

/**
 * Mischt zwei Farben im Verhältnis `weight` (0..1) zugunsten von `a`.
 *
 * @param {number} a Farbe als 0xRRGGBB
 * @param {number} b Farbe als 0xRRGGBB
 * @param {number} weight
 * @returns {number}
 */
export function mix(a, b, weight) {
  const channels = [16, 8, 0].map((shift) => {
    const left = (a >>> shift) & 0xff
    const right = (b >>> shift) & 0xff
    return Math.round(left * weight + right * (1 - weight))
  })
  return (channels[0] << 16) | (channels[1] << 8) | channels[2]
}

/**
 * Sättigt eine Farbe ab: `amount` unter 1 entsättigt, über 1 verstärkt.
 *
 * @param {number} color Farbe als 0xRRGGBB
 * @param {number} amount
 * @returns {number}
 */
export function saturate(color, amount) {
  const r = (color >>> 16) & 0xff
  const g = (color >>> 8) & 0xff
  const b = color & 0xff
  const grey = 0.299 * r + 0.587 * g + 0.114 * b
  /** @param {number} channel @returns {number} */
  const adjust = (channel) =>
    Math.max(0, Math.min(255, Math.round(grey + (channel - grey) * amount)))
  return (adjust(r) << 16) | (adjust(g) << 8) | adjust(b)
}

/**
 * Verschiebt eine Farbe im HSV-Raum; `value` ist die Helligkeit.
 *
 * `value` wird auf die Lightness angewandt, nicht nur gelesen: Ein Aufrufer,
 * der die Fassade auf 78 Prozent Helligkeit dimmt, muss ein dunkleres Grau
 * bekommen. Ohne diese Zeile wäre `value` ein toter Parameter und jeder
 * Abschattungsschritt im Zeichner still wirkungslos.
 *
 * @param {number} color Farbe als 0xRRGGBB
 * @param {{ value?: number, hue?: number, saturation?: number }} [options]
 * @returns {number}
 */
export function shift(color, { value = 1, hue = 0, saturation = 1 } = {}) {
  const r = ((color >>> 16) & 0xff) / 255
  const g = ((color >>> 8) & 0xff) / 255
  const b = (color & 0xff) / 255
  const max = Math.max(r, g, b)
  const min = Math.min(r, g, b)
  let h = 0
  const l = (max + min) / 2
  const d = max - min
  let s = d === 0 ? 0 : d / (1 - Math.abs(2 * l - 1))
  if (d !== 0) {
    if (max === r) h = ((g - b) / d) % 6
    else if (max === g) h = (b - r) / d + 2
    else h = (r - g) / d + 4
    h *= 60
    if (h < 0) h += 360
  }
  h = (h + hue + 360) % 360
  s = Math.max(0, Math.min(1, s * saturation))
  // `value` hebt oder senkt die Helligkeit. Über 1 darf es nicht über Weiß
  // hinauslaufen: Die Deckplatte soll heller wirken, nicht ausbrennen.
  const lightness = Math.max(0, Math.min(1, l * value))
  const c = (1 - Math.abs(2 * lightness - 1)) * s
  const x = c * (1 - Math.abs(((h / 60) % 2) - 1))
  const m = lightness - c / 2
  const [r1, g1, b1] =
    h < 60
      ? [c, x, 0]
      : h < 120
        ? [x, c, 0]
        : h < 180
          ? [0, c, x]
          : h < 240
            ? [0, x, c]
            : h < 300
              ? [x, 0, c]
              : [c, 0, x]
  return (
    (Math.round((r1 + m) * 255) << 16) |
    (Math.round((g1 + m) * 255) << 8) |
    Math.round((b1 + m) * 255)
  )
}
