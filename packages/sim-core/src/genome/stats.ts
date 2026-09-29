import { clampInt } from '../math'
import { UNIT_BASE } from '../units'
import { strengthOfElements } from './strength'
import type { MonsterStats } from './types'

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
 * Glutkolos einen trägen Koloss. Der Bias je Art kommt aus der **Stärke** der
 * Art in `strength.ts` — derselben Größe, die die Goldformel abliest. Vorher
 * stand hier ein Hash der Basis-ID; der ist weg, weil er eine zweite Zahl für
 * dieselbe Frage war und der Beute widersprechen konnte.
 *
 * Der Nullpunkt kommt aus `UNIT_BASE.monster` in `src/units.ts`, dem Ort, an
 * dem die Ausgangswerte stehen. Die Datei liegt bewusst **außerhalb** von
 * `combat`: als sie noch in `combat/rules.ts` lag, schloss sich der Kreis
 * `combat/rules` → `genome/stats` → `combat/rules`, und der erste Zugriff auf
 * die Basiswerte warf. `genome` rechnet keine Kämpfe, es liest nur dieselben
 * Zahlen, mit denen der Core rechnet, damit beide dieselbe Basis meinen.
 */
const BASE = UNIT_BASE.monster

/** Wie stark Element 0 (Masse) auf die Gesundheit wirkt, in Promille. */
const HP_GAIN = 260
/** Wie stark Element 1 (Tempo) auf den Angriff wirkt, in Promille. */
const ATTACK_GAIN = 220
/** Wie stark Element 2 (Härte) auf die Verteidigung wirkt, in Promille. */
const DEFENSE_GAIN = 180

/**
 * Der je Basisart abweichende Gewichtsfaktor, in Promille um 1000.
 *
 * Er kommt aus der Stärke der Art und **nicht** aus einem Hash der ID. Das ist
 * der einzige Ort, an dem eine Art von der anderen abweicht, und die Stärke
 * ist derselbe Wert, den die Goldformel abliest. Ein Hash daneben wäre eine
 * zweite Zahl für dieselbe Frage „wie ist diese Art", und die beiden könnten
 * sich widersprechen: eine Art mit Stärke 5, die zufällig 850 würfelte, wäre
 * oben in der Beute und unten im Kampf.
 *
 * Die Stufen 0 bis 5 ergeben 850 bis 1150 — genau das Band, das der Hash
 * vorher geliefert hat. Die Kampfwerte bleiben damit in derselben Größenordnung;
 * welche Art welchen Faktor bekommt, ändert sich, weil die Zuordnung jetzt aus
 * den Elementen kommt und nicht aus dem Zufall.
 */
function speciesBias(elements: readonly [number, number, number]): number {
  return 850 + strengthOfElements(elements) * 60
}

function elementGain(element: number, perMille: number): number {
  // Die Elementgrenze 1000 ist der Nullpunkt: 1,00 ergibt keinen Zuwachs.
  return Math.trunc(((element - 1000) * perMille) / 1000)
}

export function monsterStats(
  elements: readonly [number, number, number],
): MonsterStats {
  const [mass, speed, hardness] = elements
  // Die Art verschiebt die Gewichte, nicht die Grundkurve: eine Art mit
  // Faktor 1150 gewinnt rund 15 % auf allen drei Achsen, eine mit 850 verliert
  // ebenso. So bleibt der Vergleich zwischen Arten möglich. Der Faktor kommt
  // aus den Elementen allein, deshalb steht hier keine Basis-Art mehr: sie
  // würde nichts beitragen und die Signatur etwas versprechen, das sie nicht
  // hält.
  const bias = speciesBias(elements)
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
