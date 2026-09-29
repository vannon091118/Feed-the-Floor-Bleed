/**
 * Die Nachwirkung eines Helden auf den nächsten Kampf.
 *
 * Erschöpfung und Verletzung stehen seit Contract v8 im eingefrorenen Stand
 * (`activeTeam[].temporaryFatigue`/`temporaryInjury`), hatten aber keinen
 * Leser: der Transport war geschlossen, der Konsument fehlte. Hier bekommen
 * sie ihn, und zwar als **Multiplikatoren auf die Initiative** — keine neue
 * Kampfzahl, dieselbe Grenze, die das Verhaltensprofil hält.
 *
 * Die Wirkung steht am Spec und damit im Log: `specHash` hasht die Einheit
 * vollständig, und ein Replay liest nur den Log. Eine geminderte Initiative,
 * die nur im Speicher läge, wäre im Replay nicht vorhanden.
 */

/**
 * [K] Freigabe vom 2026-09-29: eine Wunde kostet 20 % Initiative, eine Stufe
 * Erschöpfung 10 %. Die Abzüge sind **verkettet**, nicht addiert — zwei Wunden
 * kosten 36 % und nicht 40 %, weil die Freigabe einen Multiplikator nennt und
 * keine Summe. Der Vermerk steht hier an der Quelle und nicht in einer Fußnote.
 */
export const CONDITION_INITIATIVE_PERMILLE = {
  injury: 800,
  fatigue: 900,
} as const

/**
 * Wie viele Stufen einer Nachwirkung höchstens zählen.
 *
 * `temporaryInjury` und `temporaryFatigue` sind Contract-Felder ohne
 * Obergrenze: eine ungebremste Verkettung wäre ein Upload, der den Lauf in eine
 * Million Rechenschritte schickt. Die Grenze stand in der freigegebenen Option
 * („z. B. 5"); jenseits der fünften Stufe ändert sie ohnehin keine
 * Entscheidung mehr.
 */
const MAX_CONDITION_STEPS = 5

/** Die Nachwirkung eines Helden: zwei ganzzahlige Stufen, keine Kampfwerte. */
export interface TeamCondition {
  temporaryFatigue: number
  temporaryInjury: number
}

/** Ein Held ohne Nachwirkung — der Grundfall, den die Engine vorher kannte. */
export const NEUTRAL_CONDITION: TeamCondition = {
  temporaryFatigue: 0,
  temporaryInjury: 0,
}

/**
 * Die Initiative eines Helden mit seinen Nachwirkungen.
 *
 * Erst die Wunden, dann die Erschöpfung, je Stufe ein Multiplikator, gekappt
 * bei `MAX_CONDITION_STEPS`. Gerechnet wird ganzzahlig mit `Math.floor`:
 * derselbe Stand ergibt denselben Wert, und der Hash hängt nicht an einer
 * Fließkommaziffer.
 */
export function heroInitiative(base: number, condition: TeamCondition): number {
  let initiative = base
  const wounded = Math.min(condition.temporaryInjury, MAX_CONDITION_STEPS)
  const tired = Math.min(condition.temporaryFatigue, MAX_CONDITION_STEPS)
  for (let step = 0; step < wounded; step += 1) {
    initiative = Math.floor(
      (initiative * CONDITION_INITIATIVE_PERMILLE.injury) / 1000,
    )
  }
  for (let step = 0; step < tired; step += 1) {
    initiative = Math.floor(
      (initiative * CONDITION_INITIATIVE_PERMILLE.fatigue) / 1000,
    )
  }
  return initiative
}
