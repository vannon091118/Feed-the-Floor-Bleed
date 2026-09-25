/** Fußpunkt-Sortierung für Fake-3D-Tiefenordnung innerhalb der `world`-Ebene. */

/**
 * Tiefenschlüssel aus Fußpunkt, Höhe und Gleichstand-Tiebreak.
 *
 * Dominant ist die Fuß-Y: Was weiter unten auf dem Schirm steht, liegt näher
 * an der Kamera und wird später gezeichnet. Die Höhe entscheidet nur bei
 * gleichem Fußpunkt, damit eine höhere Struktur eine flachere davor/dahinter
 * sauber überdeckt. `tie` trennt Objekte auf derselben Zelle stabil.
 */
export function depthValue(footY: number, height: number, tie = 0): number {
  return footY * 1000 + height + Math.min(Math.max(tie, 0), 9)
}

export function actorTie(index: number): number {
  return index % 10
}
