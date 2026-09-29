import { GLINT, mix, nextBelow, saturate, shift } from './palette.mjs'

/**
 * Der Bausatz, aus dem jedes Material seine Kachel baut.
 *
 * Diese Regeln sind aus den Stilreferenzen übersetzt, nicht aus ihnen
 * abgelesen: gedämpfte Sättigung, dunkle Fugen, ein Material, das man auf
 * zehn Metern unterscheidet. Sie stehen hier getrennt von den Materialzeichnern
 * in `draw.mjs`, weil sie deren gemeinsame Sprache sind und kein Material
 * für sich darstellen.
 */

/**
 * Grundfläche: eine Kachel ist kein Rahmen, sondern eine gebrochene Platte.
 *
 * Die Referenzböden bestehen aus großen Platten mit dunklen Fugen dazwischen.
 * Ein gleichmäßiger 1-Pixel-Rahmen liest sich als Kachelfliese; die Fuge muss
 * laufen und an den Kachelrändern zusammenpassen, sonst kachelt die Fläche
 * sichtbar als Muster statt als eine durchgehende Welt.
 *
 * `split` gibt die waagerechte Fuge an; `0` heißt durchgehende Platte.
 *
 * Kein `rng`: Die Grundfläche ist für ein Material und eine Variante immer
 * dieselbe. Der Zufall kommt über den Kachel-Seed in den Zeichner, nicht hier
 * hinein — sonst hinge dieselbe Variante an der Aufrufreihenfolge.
 */
export function baseTile(buffer, colors, size, split) {
  // Die Sättigung der Referenzbilder ist gedämpft; ungesättigte Volltonfarben
  // wirken im Spiel wie ein anderes Genre.
  const base = saturate(colors.base, 0.82)
  const edge = mix(saturate(colors.edge, 0.9), 0x000000, 0.3)

  buffer.fill(0, 0, size, size, edge)
  buffer.fill(1, 1, size - 2, size - 2, base)

  // Licht von oben: ein helles Band an der Oberkante, ein dunkles am Fuß.
  // Ein Verlauf wäre hier falsch — er verteilt sich auf Nachbarwerte und liest
  // sich über eine 32-Pixel-Kachel als Schmutz.
  buffer.hLine(1, 1, size - 2, shift(mix(base, 0xffffff, 0.22), { value: 1 }))
  buffer.hLine(1, size - 2, size - 2, shift(edge, { value: 1.5 }))

  // Die laufende Fuge: zwei Pixel tief, mit einem hellen Rand darüber, damit
  // die Platte darüber als aufgesetzt und nicht als eingelassen liest.
  if (split > 2) {
    buffer.fill(1, split, size - 2, 2, edge)
    buffer.hLine(1, split - 1, size - 2, mix(base, edge, 0.5), 170)
    buffer.hLine(
      1,
      split + 2,
      size - 2,
      shift(mix(base, 0xffffff, 0.12), { value: 1 }),
      120,
    )
  }

  return { base, edge }
}

/** Streut die Grundkörnung; hält, was die Fuge allein nicht leistet. */
export function grain(buffer, rng, color, count, size, alpha) {
  for (let index = 0; index < count; index += 1) {
    const x = 2 + nextBelow(rng, size - 4)
    const y = 2 + nextBelow(rng, size - 4)
    const value = 0.45 + rng() * 0.55
    buffer.px(x, y, shift(color, { value }), Math.round(alpha * value))
  }
}

/** Warme Glanzpunkte — der eine Ton, der überall im Referenzbild wiederkehrt. */
export function glints(buffer, rng, count, size, spread = 0.45) {
  for (let index = 0; index < count; index += 1) {
    const x = 2 + nextBelow(rng, size - 4)
    const y = 2 + nextBelow(rng, size - 4)
    const weight = spread + rng() * 0.4
    buffer.px(x, y, mix(GLINT, 0xffffff, rng() * 0.3), Math.round(210 * weight))
    if (rng() > 0.6) {
      buffer.px(x + 1, y, GLINT, Math.round(110 * weight))
    }
  }
}
