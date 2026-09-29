import { PROVISIONAL_RULES } from '../combat/rules'
import { hashStart, hashText } from '../hash'
import { clampInt } from '../math'
import type { BaseMonster, MonsterStats } from './types'

/**
 * Die Kopplung zwischen den drei Elementen und den Kampfwerten.
 *
 * **Die Zahlen sind `[K]`.** Sie sind nicht abgenommen; die Kampfbalance ist
 * laut `docs/VISUAL_GRUNDSATZ.md` offen. Die Mechanik steht, die Gewichte
 * nicht — sie gehören vor die Freigabe ersetzt, ohne dass die Ableitung sich
 * ändert.
 *
 * Jede Basisart übersetzt dasselbe Element anders. Das ist der Grund, warum aus
 * zwanzig Basis-Monstern ein breites Spektrum entsteht statt zwanzig Kopien:
 * Element 1 (Tempo) macht beim Frostwolf einen schnellen Jäger und beim
 * Glutkolos einen trägen Koloss. Der Bias je Art kommt aus einem Hash der
 * Basis-ID — stabil, ohne Tabelle, und ohne eine zweite Zahl, die gepflegt
 * werden müsste.
 *
 * Der Nullpunkt kommt aus `PROVISIONAL_RULES.monster`, dem einzigen Ort, an
 * dem die Ausgangswerte stehen. `genome` rechnet keine Kämpfe, es liest nur
 * dieselben Zahlen, mit denen der Core rechnet, damit beide dieselbe Basis
 * meinen.
 */
const BASE = PROVISIONAL_RULES.monster

/** Wie stark Element 0 (Masse) auf die Gesundheit wirkt, in Promille. */
const HP_GAIN = 260
/** Wie stark Element 1 (Tempo) auf den Angriff wirkt, in Promille. */
const ATTACK_GAIN = 220
/** Wie stark Element 2 (Härte) auf die Verteidigung wirkt, in Promille. */
const DEFENSE_GAIN = 180

/**
 * Der je Basisart abweichende Gewichtsfaktor, in Promille um 1000.
 *
 * Aus dem Hash der ID kommt ein Wert zwischen 850 und 1150: eine Art ist
 * spürbar zäh, eine andere spürbar schnell, ohne dass eine Tabelle mit
 * Handwerten gepflegt werden muss. Zwei Arten mit gleicher ID hätten denselben
 * Faktor — das ist gewollt, denn die ID ist die Identität.
 */
function speciesBias(id: string): number {
  return 850 + (hashText(hashStart(), id) % 301)
}

function elementGain(element: number, perMille: number): number {
  // Die Elementgrenze 1000 ist der Nullpunkt: 1,00 ergibt keinen Zuwachs.
  return Math.trunc(((element - 1000) * perMille) / 1000)
}

export function monsterStats(
  base: BaseMonster,
  elements: readonly [number, number, number],
): MonsterStats {
  const [mass, speed, hardness] = elements
  // Die Art verschiebt die Gewichte, nicht die Grundkurve: eine Art mit
  // Faktor 1150 gewinnt rund 15 % auf allen drei Achsen, eine mit 850 verliert
  // ebenso. So bleibt der Vergleich zwischen Arten möglich.
  const bias = speciesBias(base.id)
  const scaled = (value: number, perMille: number): number =>
    Math.trunc((elementGain(value, perMille) * bias) / 1000)

  const maxHp = BASE.maxHp + scaled(mass, HP_GAIN)
  const attack = BASE.attack + scaled(speed, ATTACK_GAIN)
  const defense = BASE.defense + scaled(hardness, DEFENSE_GAIN)
  // Tempo verschiebt Initiative und die Cooldowns gemeinsam: ein schnelles
  // Wesen ist nicht nur earlier, es greift auch häufiger an.
  const tempo = Math.trunc((speed - 1000) / 1000)
  return {
    maxHp,
    attack,
    defense,
    initiative: clampInt(BASE.initiative + tempo * 60, 100, 900),
    moveCooldown: clampInt(BASE.moveCooldown - tempo, 1, 6),
    attackCooldown: clampInt(BASE.attackCooldown - tempo, 1, 6),
  }
}
