import type { Resources } from '../fixture-data'
import type { FrozenBalance } from './balance'
import { type FloorRejection, floorCost } from './economy'
import { commitVillage, dayNight, villageEditable } from './state'

/**
 * Das Etage-Kommando: die eine Stelle, an der die Absicht „eine Etage mehr
 * besuchen" auf den Bestand trifft.
 *
 * Getrennt von `commands.ts`, weil dort der Dorfbau entscheidet — Baustellen,
 * Stufen und Landbreite — und hier die Expedition wächst. Beide laufen über
 * denselben Schreibpfad `commitVillage` und dieselben Zusagen: nur am Tag,
 * kein negativer Bestand, und ein abgelehnter Kauf verändert nichts. Die
 * Grenzen (erste kaufbare Etage, quadratischer Preis) kennt auch diese Datei
 * nicht; sie liegen in `economy.ts` hinter `floorCost`, die Zahl dahinter in
 * `balance.ts`.
 */

export type FloorResult =
  | { ok: false; reason: 'not-day-phase' }
  | Exclude<FloorRejection, { ok: true }>
  | { ok: false; reason: 'not-affordable'; cost: number }
  | { ok: true; floors: number; cost: number }

/**
 * Schaltet genau eine Etage der Expedition frei.
 *
 * Eine Etage und keine Zielzahl: Der Preis hängt an der gekauften Etage
 * selbst, und wer zwei will, kauft zweimal — mit der Absage nach dem ersten,
 * wenn das Gold nicht reicht. Die Ziel-Etage ist die aktuelle plus eins; eine
 * Zahl dafür führt der Aufrufer nicht.
 *
 * Die Guards in `floorCost` tun die Grenzarbeit: Etage 1 gehört zum Ausgang
 * und ist nicht kaufbar, gebrochene oder negative Etagen sind keine Etagen.
 * Abgerechnet wird nur Gold, und der Bestand trägt die neue Etage im selben
 * Zug wie die Zahlung.
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
