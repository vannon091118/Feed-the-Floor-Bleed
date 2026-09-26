import type { TerminalRaidJob } from '@floor/contracts'
import { fixture } from '../fixture-data'
import type { Yield } from './buildings'

/**
 * Beute als Ableitung des Auftragsergebnisses.
 *
 * Es gibt bewusst kein Loot-Feld im Contract: die Beute wird aus dem
 * Ergebnis abgeleitet, das der Core bereits liefert. Das hält Wire-Schema,
 * `sim_version` und Replay-Hash unverändert und macht die Herkunft der Ware
 * nachvollziehbar — sie stammt aus dem Ausgang, nicht aus einem Nebenwert.
 *
 * Bezahlt wird nur, was tatsächlich gefallen ist. Ein gescheiterter oder
 * abgelaufener Auftrag hinterlässt nichts, weil der Auftrag die Beute nicht
 * sichern konnte.
 */
export interface Loot extends Yield {
  /** Anzahl gefallener Verteidiger, aus denen Roster und Ergebnis abgeleitet. */
  slain: number
  /** Der Boss ist gefallen und bringt eine Prämie. */
  bossSlain: boolean
}

const GOLD_PER_SLAIN = 15
const MATERIAL_PER_SLAIN = 2
const GOLD_FOR_BOSS = 30

/** Zahl der zu Beginn besetzten Verteidigerplätze. */
function garrisonSize(): number {
  return fixture.monsterSlots.filter((slot) => slot.monsterId).length
}

/** Keine Beute: der Auftrag brachte den Dungeon nicht unter. */
export function lootFromJob(job: TerminalRaidJob | null): Loot | null {
  if (!job || job.status !== 'completed') return null
  const { monstersAlive, bossAlive } = job.result.summary
  const slain = Math.max(0, garrisonSize() - monstersAlive)
  const bossSlain = !bossAlive
  return {
    slain,
    bossSlain,
    gold: slain * GOLD_PER_SLAIN + (bossSlain ? GOLD_FOR_BOSS : 0),
    materials: slain * MATERIAL_PER_SLAIN,
  }
}

/** Kurze Zeile für die Oberfläche, damit die Herkunft der Zahlen sichtbar bleibt. */
export function lootLabel(loot: Loot): string {
  const parts = [`${loot.slain} gefallen`]
  if (loot.bossSlain) parts.push('Boss gefallen')
  return parts.join(' · ')
}
