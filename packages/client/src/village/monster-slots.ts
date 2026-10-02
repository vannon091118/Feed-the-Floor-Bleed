import { baseMonsters } from '@floor/sim-core'
import { commitVillage, dayNight, villageEditable } from './state'

/**
 * Die Belegung der Monster-Plätze — der Ort, an dem der Spieler entscheidet,
 * was ihm gegensteht.
 *
 * Vorher stand die Belegung in `fixture.monsterSlots`, einer Konstante, die der
 * Spielerpfad las. Eine Wahl, die der Spieler trifft, ist Zustand und keine
 * Vorgabe des Fixtures; solange sie im Fixture stand, gab es keine Wahl.
 *
 * Ein `null` ist ein freier Platz und kein leerer Platz. Die Zahl der Plätze
 * kommt aus der Etage, nicht aus diesem Bestand — sonst wäre die Liste die
 * zweite Wahrheit über die Etagengröße.
 */
export type SlotResult =
  | { ok: true; slot: number; monsterId: string | null }
  | { ok: false; reason: 'not-day-phase' }
  | { ok: false; reason: 'unknown-slot'; slot: number }
  | { ok: false; reason: 'unknown-monster'; monsterId: string }

/**
 * Stellt die Art auf einem Monster-Platz um.
 *
 * `null` leert den Platz. Eine Art, die die Registry nicht kennt, wird
 * abgewiesen — dieselbe Regel, die `baseIdsBySlot` beim Lesen fährt, damit eine
 * erfundene Art nicht erst in der Anzeige auffällt.
 */
export function placeMonster(
  slot: number,
  monsterId: string | null,
): SlotResult {
  if (!villageEditable()) return { ok: false, reason: 'not-day-phase' }
  const { village } = dayNight.value
  if (
    !Number.isInteger(slot) ||
    slot < 0 ||
    slot >= village.monsterSlots.length
  )
    return { ok: false, reason: 'unknown-slot', slot }
  if (
    monsterId !== null &&
    !baseMonsters().some((base) => base.id === monsterId)
  )
    return { ok: false, reason: 'unknown-monster', monsterId }
  const monsterSlots = village.monsterSlots.map((belegung, index) =>
    index === slot ? { monsterId } : belegung,
  )
  const geschrieben = commitVillage({ ...village, monsterSlots })
  if (!geschrieben) return { ok: false, reason: 'not-day-phase' }
  return { ok: true, slot, monsterId }
}
