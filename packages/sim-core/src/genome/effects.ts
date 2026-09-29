import { bulwark } from './bonus-bulwark'
import { endurance } from './bonus-endurance'
import { frenzy } from './bonus-frenzy'
import { precision } from './bonus-precision'
import { swiftness } from './bonus-swiftness'
import { vitality } from './bonus-vitality'
import type { StatsModifier } from './effect-kit'
import { deepLungs } from './trait-deep-lungs'
import { focused } from './trait-focused'
import { heavyTread } from './trait-heavy-tread'
import { keenEdge } from './trait-keen-edge'
import { restless } from './trait-restless'
import { toughHide } from './trait-tough-hide'
import { BONUS_IDS, type BonusId, TRAIT_IDS, type TraitId } from './types'

/**
 * Die Zuordnung von ID zu Effekt.
 *
 * **Die Prozente in den Effektdateien sind `[K]`.** Kein Effekt ist abgenommen;
 * die Kampfbalance ist laut `docs/VISUAL_GRUNDSATZ.md` offen. Jeder Effekt gibt
 * und nimmt einen Gegenwert, damit ein Zucht-Trait keine freie Verbesserung
 * ist — welche Prozentzahl das jeweils sind, ist der offene Teil.
 *
 * Beide Listen sind die einzige Stelle, an der ein Effekt an seinen Namen
 * kommt. Eine ID ohne Eintrag ist ein Fehler beim Laden, kein stiller
 * übersprungener Wert — sonst bekäme ein Genom einen Teil seiner Eigenschaften
 * und schiene vollständig.
 */
const TRAITS: Record<TraitId, StatsModifier> = {
  toughHide,
  keenEdge,
  deepLungs,
  heavyTread,
  restless,
  focused,
}

const BONUSES: Record<BonusId, StatsModifier> = {
  bulwark,
  frenzy,
  endurance,
  swiftness,
  precision,
  vitality,
}

for (const id of TRAIT_IDS) {
  if (!TRAITS[id]) throw new Error(`genome: Trait ${id} hat keine Logik`)
}
for (const id of BONUS_IDS) {
  if (!BONUSES[id]) throw new Error(`genome: Bonus ${id} hat keine Logik`)
}

export function traitEffect(id: TraitId): StatsModifier {
  return TRAITS[id]
}

export function bonusEffect(id: BonusId): StatsModifier {
  return BONUSES[id]
}
