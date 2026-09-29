import type { z } from 'zod'
import { EMPTY_CELL, PLACEMENT_CELL } from './cell'
import { DungeonGridSchema } from './grid'
import type { RaidSnapshot } from './raid-snapshot'
import { versionEnvelope } from './version'

/**
 * Was der Angreifer sehen darf.
 *
 * Der Angreifer sieht nur das Labyrinth und den Boss — dazu kommen später die
 * Bonus-Schätze, die er markieren darf, um einen Umweg zu wählen. Verborgen
 * bleiben: Monsterplatzierungen, Gruppen, Patrouillen, der Roster und der
 * Bestand. Sie stehen ausschließlich im privaten Stand (`raid-snapshot.ts`),
 * den nur der Server führt; die Angreifer-Fassung entsteht aus ihm über
 * `toPublicView`.
 *
 * Das Schema ist `.strict()` und trägt nur `dungeon`: Ein Rohling mit
 * `monsterSlots` scheitert hier, und damit auch jede Match-Antwort, die ihn
 * mitschickt. Verbergen am Bildschirm wäre keine Verbergung.
 */
export const RaidPublicViewSchema = versionEnvelope
  .extend({ dungeon: DungeonGridSchema })
  .strict()

export type RaidPublicView = z.infer<typeof RaidPublicViewSchema>

/** Platzierungsmarkierungen werden zu Boden: sichtbar bleibt nur der Weg. */
function maskedCells(cells: readonly number[]): number[] {
  return cells.map((cell) => (cell === PLACEMENT_CELL ? EMPTY_CELL : cell))
}

/**
 * Der einzige erlaubte Weg vom privaten Stand zur Angreifer-Sicht.
 *
 * Die Maske ändert nur Platzierungszellen. Spawn und Boss bleiben stehen, Wände
 * ebenso; deshalb bleibt die Route dieselbe, denn eine Platzierungsmarkierung
 * kostet seit dem 2026-09-29 so viel wie Boden.
 *
 * Geparst wird der Rückgabewert und nicht der Eingang: Der Aufrufer hat bereits
 * einen geprüften Stand, und das Parsen hier belegt, dass die Maskierung das
 * Raster nicht ungültig macht — genau ein Spawn, genau ein Boss, nur bekannte
 * Zellnummern.
 */
export function toPublicView(snapshot: RaidSnapshot): RaidPublicView {
  return RaidPublicViewSchema.parse({
    contractVersion: snapshot.contractVersion,
    simVersion: snapshot.simVersion,
    dungeon: {
      cells: maskedCells(snapshot.dungeon.cells),
      spawn: { ...snapshot.dungeon.spawn },
      boss: { ...snapshot.dungeon.boss },
    },
  })
}
