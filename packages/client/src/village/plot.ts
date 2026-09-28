/**
 * Platzierungsgeometrie des Dorfes.
 *
 * Reine Funktionen ohne Zustand, ohne Signale und ohne Nebenwirkungen. Jede
 * Dimension (Spalten, Zeilen) und jeder Grundriss kommt ausdrücklich als
 * Parameter herein; es gibt hier keinen impliziten Standardwert und keine
 * Wirtschaftsgröße — Kosten, Ertrag, Bestand und Löhne bleiben bis zur
 * Balancefreigabe außen vor.
 *
 * Das Vokabular ist rein geometrisch: Raster, Rechteck, Nachbarschaft. Weder
 * Welt- noch Präsentationsbegriffe werden hierher gezogen.
 */

/** Ein belegter Grundriss in Rasterzellen, Ursprung oben links. */
export interface Footprint {
  x: number
  y: number
  width: number
  height: number
}

/** Die Rastermaße, die jede Platzierung gegenprüft. */
export interface GridBounds {
  columns: number
  rows: number
}

/** Warum eine Platzierung abgewiesen wurde. */
export type PlacementRejection =
  | { ok: false; reason: 'out-of-bounds' }
  | { ok: false; reason: 'overlaps'; conflict: Footprint }
  | { ok: true }

/**
 * Schneiden sich zwei Grundrisse in mindestens einer Zelle?
 *
 * Randberührung zählt nicht: zwei aneinanderstoßende Grundrisse bleiben
 * gültig, weil sie genau an der Kante nebeneinander stehen.
 */
export function rectsIntersect(a: Footprint, b: Footprint): boolean {
  return (
    a.x < b.x + b.width &&
    b.x < a.x + a.width &&
    a.y < b.y + b.height &&
    b.y < a.y + a.height
  )
}

/**
 * Überlappt der Grundriss einen der bereits belegten?
 *
 * Die belegte Liste ist eine Kopie, die der Aufrufer übergibt; dieser
 * Ort führt keinen eigenen Dorfzustand.
 */
export function footprintOverlaps(
  candidate: Footprint,
  occupied: readonly Footprint[],
): boolean {
  return occupied.some((other) => rectsIntersect(candidate, other))
}

/** Liegt der Grundriss vollständig im Raster? */
export function footprintWithinBounds(
  footprint: Footprint,
  bounds: GridBounds,
): boolean {
  return (
    footprint.x >= 0 &&
    footprint.y >= 0 &&
    footprint.x + footprint.width <= bounds.columns &&
    footprint.y + footprint.height <= bounds.rows
  )
}

/**
 * Die eine Platzierungsentscheidung: erst die Rastergrenze, dann die
 * Überlappung. Bei Ablehnung nennt das Ergebnis den Grund und im
 * Überlappungsfall den konkurrierenden Grundriss, damit die Oberfläche später
 * sagen kann, woran es lag.
 */
export function canPlace(
  candidate: Footprint,
  occupied: readonly Footprint[],
  bounds: GridBounds,
): PlacementRejection {
  if (!footprintWithinBounds(candidate, bounds))
    return { ok: false, reason: 'out-of-bounds' }
  const conflict = occupied.find((other) => rectsIntersect(candidate, other))
  if (conflict) return { ok: false, reason: 'overlaps', conflict }
  return { ok: true }
}

/**
 * Die vier Kantennachbarn (oben, rechts, unten, links) in dieser Reihenfolge.
 *
 * Diagonalen zählen nicht: sie wären weder überlappend noch an einer Kante
 * verbunden. Nachbarn außerhalb des Rasters fallen weg, damit das Ergebnis
 * nur platzierbare Nachbarlagen nennt.
 */
export function edgeNeighbours(
  footprint: Footprint,
  bounds: GridBounds,
): Footprint[] {
  const { x, y, width, height } = footprint
  const candidates: Footprint[] = [
    { x, y: y - 1, width, height },
    { x: x + width, y, width: 1, height },
    { x, y: y + height, width, height: 1 },
    { x: x - 1, y, width: 1, height },
  ]
  return candidates.filter((n) => footprintWithinBounds(n, bounds))
}

/**
 * Die horizontale Landerweiterung: die Höhe bleibt unangetastet, die
 * Spaltenzahl wird durch die ausdrücklich übergebene Folge ersetzt. Eine
 * Verkleinerung ist keine Erweiterung und wird abgewiesen — die Rastermaße
 * dürfen nicht stillschweigend schrumpfen.
 */
export function expandHorizontally(
  currentColumns: number,
  rows: number,
  nextColumns: number,
): GridBounds {
  if (nextColumns < currentColumns)
    throw new Error('Landerweiterung verkleinert die Spaltenzahl nicht')
  return { columns: nextColumns, rows }
}
