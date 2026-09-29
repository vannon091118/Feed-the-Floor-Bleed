import type { Resources } from '../fixture-data'
import type { FrozenBalance } from './balance'
import { type FloorRejection, floorCost } from './economy'
import { commitVillage, dayNight, villageEditable } from './state'

/**
 * Das Etage-Kommando: die eine Stelle, an der die Absicht „eine Etage mehr
 * besuchen" auf den Bestand trifft — getrennt von `commands.ts`, weil dort
 * der Dorfbau entscheidet und hier die Expedition wächst.
 */

export type FloorResult =
  | { ok: false; reason: 'not-day-phase' }
  | Exclude<FloorRejection, { ok: true }>
  | { ok: false; reason: 'not-affordable'; cost: number }
  | { ok: true; floors: number; cost: number }

/**
 * Schaltet genau eine Etage der Expedition frei, abgerechnet nur in Gold.
 * Die Grenzregeln (erste kaufbare Etage, Ganzzahl-Prüfung) liegen in
 * `floorCost`; der Fehlbetrag an Gold wird hier geprüft, nicht dort.
 */
export function buyFloor(config: FrozenBalance): FloorResult {
  if (!villageEditable()) return { ok: false, reason: 'not-day-phase' }
  const { village } = dayNight.value
  const floor = village.floors + 1
  const price = floorCost(floor, config)
  if (!price.ok) return price
  if (village.resources.gold < price.cost)
    return { ok: false, reason: 'not-affordable', cost: price.cost }
  const nachZahlung: Resources = {
    gold: village.resources.gold - price.cost,
    materials: village.resources.materials,
  }
  const geschrieben = commitVillage({
    ...village,
    floors: floor,
    resources: nachZahlung,
  })
  if (!geschrieben) return { ok: false, reason: 'not-day-phase' }
  return { ok: true, floors: floor, cost: price.cost }
}
