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
  | { ok: false; reason: 'not-a-cell' }
  | { ok: false; reason: 'out-of-bounds' }
  | { ok: false; reason: 'overlaps'; conflict: Footprint }
  | { ok: true }

/**
 * Belegt der Grundriss ganze Rasterzellen mit Ausdehnung?
 *
 * Ein Raster besteht aus ganzen Zellen; `x: 1.5` liegt zwar innerhalb der
 * Grenzen, bezeichnet aber keine. `Number.isInteger` fällt dabei zugleich für
 * `NaN` und für beide Unendlichkeiten. Die Breite und die Höhe müssen
 * mindestens 1 sein: ein Grundriss ohne Ausdehnung überlappt nichts und wäre
 * sonst unbegrenzt oft platzierbar. Eine negative Lage bleibt dagegen eine
 * Randlage und wird als solche gemeldet — dafür ist der nächste Test da.
 */
function isCellFootprint(footprint: Footprint): boolean {
  const { x, y, width, height } = footprint
  return (
    Number.isInteger(x) &&
    Number.isInteger(y) &&
    Number.isInteger(width) &&
    Number.isInteger(height) &&
    width >= 1 &&
    height >= 1
  )
}

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
 * Die eine Platzierungsentscheidung: erst die Zelle, dann die Rastergrenze,
 * dann die Überlappung. Bei Ablehnung nennt das Ergebnis den Grund und im
 * Überlappungsfall den konkurrierenden Grundriss; `commands.ts` reicht ihn
 * unverändert in sein Ergebnis, und `test/village-plot.test.ts` hält ihn fest.
 */
export function canPlace(
  candidate: Footprint,
  occupied: readonly Footprint[],
  bounds: GridBounds,
): PlacementRejection {
  if (!isCellFootprint(candidate)) return { ok: false, reason: 'not-a-cell' }
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
 *
 * Jeder Streifen ist an der geteilten Kante eine Zelle dick und läuft sonst
 * über die Ausdehnung des Grundrisses. Sonst überlappte der oberre Streifen den
 * eigenen Grundriss und die Nachbarlage wäre nicht platzierbar.
 */
export function edgeNeighbours(
  footprint: Footprint,
  bounds: GridBounds,
): Footprint[] {
  const { x, y, width, height } = footprint
  const candidates: Footprint[] = [
    { x, y: y - 1, width, height: 1 },
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

/**
 * Die erste Zelle links oben, auf der ein Gebäude der Größe Platz fände.
 *
 * Die Oberfläche braucht eine Stelle, an der sie einen Bau-Befehl absetzen
 * kann, ohne den Spieler eine Zelle wählen zu lassen. Diese Funktion ist genau
 * diese Stelle und keine: Sie sucht zeilenweise von oben links, prüft jede
 * Zelle mit `canPlace` und liefert die erste freie. Damit kann die Suche nicht
 * eine Belegung übersehen, die `canPlace` als Konflikt melden würde.
 *
 * `undefined` heißt: Das Dorf ist voll. Der Aufrufer sagt das dem Spieler,
 * er wirft nicht.
 */
export function firstFreeSite(
  size: { width: number; height: number },
  occupied: readonly Footprint[],
  bounds: GridBounds,
): { x: number; y: number } | undefined {
  for (let y = 0; y < bounds.rows; y += 1) {
    for (let x = 0; x < bounds.columns; x += 1) {
      const site = { x, y, ...size }
      if (canPlace(site, occupied, bounds).ok) return { x, y }
    }
  }
  return undefined
}
