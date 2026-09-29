import type { BuildingKind } from '../village/balance'

/**
 * Die Baugegenstand-Arten kommen aus der Dorf-Domäne: `village` besitzt die
 * Gebäude, die Config in `balance.ts` ist nach Art verschlüsselt. Der Renderer
 * leiht sich nur dieses Vokabular; er führt selbst keinen Dorfbestand.
 *
 * Diese Datei hält damit nur noch, was zur Präsentation gehört und nicht aus
 * dem Store kommt: die Maße der Dorfwelt, die Bäume des Untergrunds und die
 * Projektion des Rasters in Weltpixel. Die Orte der Gebäude stehen im Store —
 * eine zweite Liste daneben wäre eine zweite Wahrheit.
 */
export type { BuildingKind }

export const VILLAGE_WORLD_WIDTH = 1000
export const VILLAGE_WORLD_HEIGHT = 640

export interface VillageTree {
  x: number
  y: number
}

/** Dekorative Bäume außerhalb des Rasters. */
export const VILLAGE_TREES: readonly VillageTree[] = [
  { x: 76, y: 188 },
  { x: 438, y: 125 },
  { x: 852, y: 136 },
  { x: 318, y: 502 },
  { x: 688, y: 528 },
  { x: 64, y: 548 },
  { x: 928, y: 540 },
]

/**
 * Die Rastermaße des Dorfes: Spalten aus dem Bestand, Zeilen aus der Config.
 *
 * Beide Zahlen kommen ausdrücklich herein, weil die Szene sie bei jedem Takt
 * neu liest: Die Spaltenzahl wächst mit der Landerweiterung, die Zeilenzahl
 * steht fest. Die Projektion rechnet damit und mit keiner eigenen Kopie.
 */
export interface VillageGrid {
  columns: number
  rows: number
}

/** Eine belegte Zellfläche in Rasterzellen — strukturgleich zum Store. */
export interface VillagePlot {
  x: number
  y: number
  width: number
  height: number
}

/** Der Dorfbestand, wie die Szene ihn liest: Art und belegte Zellen je Haus. */
export interface VillagePlots {
  grid: VillageGrid
  buildings: readonly { kind: BuildingKind; footprint: VillagePlot }[]
}

/**
 * Ein Plot in Weltpixeln, fußpunktverankert.
 *
 * `x` ist die Mitte und `y` die Unterkante: genau die Werte, die `placeSprite`
 * mit seinem Anker `(0.5, 1)` erwartet. Die Breite und die Höhe sind die
 * Zellfläche selbst, damit der Standort eines Gebäudes und sein Bild dieselbe
 * Zahl benutzen.
 */
export interface VillagePlotRect {
  x: number
  y: number
  width: number
  height: number
}

/**
 * Legt das Raster über die Dorfwelt.
 *
 * Die Plotseite ist die Welthöhe geteilt durch die Zeilenzahl, das Feld selbst
 * liegt waagerecht mittig. Bei den zehn Startzeilen ergibt das 64 Pixel je
 * Zelle und einen Ursprung von 180: Die Welthöhe geht ohne Rest auf, und der
 * Weg des Untergrunds (y 345) fällt zwischen die Zeilen von Rathaus und Gilde.
 * Eine zweite Skalierung neben dieser gibt es nicht — wer die Zeilenzahl
 * ändert, verschiebt das Raster, nicht das Bildformat.
 */
export function projectVillagePlot(
  plot: VillagePlot,
  grid: VillageGrid,
): VillagePlotRect {
  const size = VILLAGE_WORLD_HEIGHT / grid.rows
  const originX = (VILLAGE_WORLD_WIDTH - grid.columns * size) / 2
  return {
    x: originX + (plot.x + plot.width / 2) * size,
    y: (plot.y + plot.height) * size,
    width: plot.width * size,
    height: plot.height * size,
  }
}
