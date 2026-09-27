import type { BuildingKind } from '../render/village-layout'

const LABELS: Record<BuildingKind, string> = {
  hall: 'Rathaus',
  guild: 'Gilde',
  house: 'Wohnhaus',
  workshop: 'Werkstatt',
}

/** Sprechende Beschriftung eines DorfOrts; `building.kind` bleibt Datenmodell. */
export function buildingLabel(kind: BuildingKind): string {
  return LABELS[kind]
}
