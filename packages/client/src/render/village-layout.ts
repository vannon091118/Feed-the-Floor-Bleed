import type { BuildingKind } from '../village/balance'

/**
 * Die Baugegenstand-Arten kommen aus der Dorf-Domäne: `village` besitzt die
 * Gebäude, und die Config in `balance.ts` ist nach Art verschlüsselt. Der
 * Renderer leiht sich nur das Vokabular und hält Ort, Größe und Texturen.
 */
export type { BuildingKind }

export const VILLAGE_WORLD_WIDTH = 1000
export const VILLAGE_WORLD_HEIGHT = 640

export interface VillageBuilding {
  id: string
  kind: BuildingKind
  x: number
  y: number
  width: number
  height: number
}

export interface VillageTree {
  x: number
  y: number
}

/**
 * Präsentationsorte in Weltpixeln.
 *
 * Der Dorf-Owner führt seit den Baukommandos einen eigenen Bestand
 * (`village/state.ts`) — in Rasterzellen, nicht in Pixeln. Diese Liste ist damit
 * die Anzeige von etwas, das es zweimal gibt: Bis die Dorfszene den Store liest,
 * ist sie die einzige Quelle des Bildes; die Verdrahtung ist ein eigener Slice,
 * weil `village-scene.ts` am LOC-Cap steht.
 */
export const VILLAGE_BUILDINGS: readonly VillageBuilding[] = [
  { id: 'rathaus', kind: 'hall', x: 205, y: 190, width: 112, height: 126 },
  { id: 'gilde', kind: 'guild', x: 600, y: 202, width: 104, height: 118 },
  { id: 'haus-west', kind: 'house', x: 118, y: 404, width: 76, height: 86 },
  { id: 'werkstatt', kind: 'workshop', x: 432, y: 416, width: 88, height: 98 },
  { id: 'haus-ost', kind: 'house', x: 778, y: 395, width: 76, height: 86 },
]

/** Dekorative Bäume außerhalb der Fußabdrücke der Gebäude. */
export const VILLAGE_TREES: readonly VillageTree[] = [
  { x: 76, y: 188 },
  { x: 438, y: 125 },
  { x: 852, y: 136 },
  { x: 318, y: 502 },
  { x: 688, y: 528 },
  { x: 64, y: 548 },
  { x: 928, y: 540 },
]
