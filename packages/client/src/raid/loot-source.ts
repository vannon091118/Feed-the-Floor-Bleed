import { slotLootProfile } from '@floor/sim-core'
import { fixture, type MonsterSlot } from '../fixture-data'
import type { FallenOpponent } from '../village/loot'
import { playbackLog } from './playback'

/**
 * Die gefallenen Verteidiger des geladenen Laufs.
 *
 * Das ist der Leser, den `goldForRun` in `village/loot.ts` seit seiner Freigabe
 * nicht hatte: die Formel war freigegeben, gebaut und geprüft, aber keine Zeile
 * im Spielerpfad reichte ihr einen Gegner. Die Beute eines Laufs entsteht
 * deshalb hier und nirgends sonst, und `activeTeam` ist der einzige andere
 * Zustand, der den Rückweg antritt.
 *
 * Die Zuordnung läuft über die **belegten** Plätze. Der Core zählt belegte
 * Plätze und nicht Slots; die Verteidiger heißen `monster-0` bis `monster-4`
 * deshalb in der Reihenfolge der belegten Plätze. Ein Index in der
 * Slot-Liste wäre ein Index aus einer anderen Menge: bei diesem Fixture mit
 * zwei belegten von fünf Plätzen zeigte er hinter den Steingolem statt auf ihn,
 * sobald der erste Slot leer ist.
 *
 * Der Boss fällt heraus, obwohl er auf der Monster-Seite steht — er ist kein
 * Goldträger (`docs/GOLDFORMEL.md`). Eine Art, die die Registry nicht kennt,
 * liefert `null` und wird übergangen: eine Beute aus einer unbekannten Art wäre
 * erfunden. Ein leerer Platz ebenso; deshalb übergeht die Zuordnung sie und
 * nicht die ganze Liste.
 */
export function fallenLootProfiles(
  slots: readonly MonsterSlot[] = fixture.monsterSlots,
): FallenOpponent[] {
  const log = playbackLog.value?.log
  if (!log) return []
  const occupied = slots.filter((slot) => slot.monsterId !== null)
  const fallen = new Set<number>()
  for (const event of log.events) {
    if (event.type !== 'death') continue
    const unit = /^monster-(\d+)$/.exec(event.actorId)
    if (unit) fallen.add(Number(unit[1]))
  }
  const profiles: FallenOpponent[] = []
  for (const slot of [...fallen].sort((a, b) => a - b)) {
    const profile = slotLootProfile(occupied[slot] ?? { monsterId: null })
    if (profile) profiles.push(profile)
  }
  return profiles
}
