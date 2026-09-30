import { toFixed } from '../math'
import type { CombatLog, CombatUnitSpec } from './types'

/**
 * Der Boss als eigenes Wesen.
 *
 * Der Boss teilt sich mit den Monstern die Seite `side: 'monsters'`, ist aber
 * kein Monster: die Summary führt ihn als eigenes Feld `bossAlive`, und die
 * Stufenentscheidung prüft ausschließlich ihn. Genau deshalb liegt seine
 * Identität hier und nicht als `role === 'boss'` an jedem Leser verstreut.
 *
 * Verstärkungen, die nur den Boss treffen, gehören in diese Datei: der Boss
 * ist die einzige Einheit, für die sie gelten, und ein zweiter Ort für seine
 * Werte wäre eine zweite Wahrheit über ihn.
 */

/** Rolle des Bosses. Die einzige Stelle, die den Boss als Boss erkennt. */
const BOSS_ROLE = 'boss' as const

/**
 * Ausgangswerte des Bosses. **Freigegeben am 2026-09-29** (`[N]`), gemessen
 * statt gesetzt; die Zahlen und ihre Quelle stehen in
 * `docs/CONCEPT_REVIEW.md` Abschnitt 0b.
 *
 * **Der Boss war die eigentliche Wand, nicht die Heldenbasis.** Mit den
 * Vorgängerwerten 200/16/5/700 gewann das Dreierteam in **0 von 32 Seeds** —
 * auch ohne einen einzigen Platzmonster, also allein gegen den Boss. Der Lauf
 * war kein Zeitproblem: er endete nach rund 208 von 1800 Ticks im Nahkampf.
 * Rechnerisch 200000 Boss-Gesundheit gegen 144000 für das ganze Team, dazu
 * Rüstung 5, die den Heldenangriff von 12000 auf rund 4070 drückte.
 *
 * **Die Form, die daraus folgt:** ein Koloss, der nicht gepanzert, sondern
 * groß ist. Die Rüstung sinkt unter die eines Basishelden, damit der Kampf
 * lang genug dauert, bis Schwankung und die Platzmonster eine echte
 * Niederlage erzeugen; die Bedrohung kommt aus der Lebensleiste, nicht aus
 * der Panzerung. Deshalb ist der Angriff des Bosses gleich dem eines Helden
 * und seine Initiative gleich der des Teams — er ist nicht unfair, er ist
 * ausdauernd.
 *
 * **Der Wert ist gemessen, nicht geschätzt.** 48 Seeds je Verteidigerplatz,
 * Teamgröße 3: Boss plus drei Platzmonster ergibt 88 % Heldensiege und liegt
 * damit im 80–95-%-Band des Referenzkampfs aus Abschnitt 0b. Der Golden-Pin in
 * `combat-pin.test.ts` ist mit diesen Werten gewandert und trägt den Grund
 * dort.
 */
const BOSS_RULES = {
  maxHp: toFixed(132),
  attack: toFixed(12),
  defense: toFixed(1),
  initiative: 500,
  moveCooldown: 4,
  attackCooldown: 3,
}

/** Trägt diese Einheit die Boss-Rolle? */
export function isBoss(unit: { role: string }): boolean {
  return unit.role === BOSS_ROLE
}

/**
 * Der Boss steht am Ende der Route und ist die Bedingung des Heldensiegs.
 *
 * `ambushZoneId` ist bei ihm `-1`: er steht in seiner eigenen Kammer, nicht in
 * einer Platzierungsgruppe. Ein Hinterhalt ist die Waffe der Aufgestellten.
 */
export function bossSpec(routeIndex: number): CombatUnitSpec {
  return {
    id: 'boss-0',
    side: 'monsters',
    role: BOSS_ROLE,
    // Der Boss trägt kein Genom und damit kein Profil: er ist Bedingung des
    // Heldensiegs und wählt wie zuvor das nächste Ziel. Eine Klasse hat er
    // ebenso wenig — Klassen sind das Vokabular der Helden.
    behavior: 'none',
    class: 'none',
    maxHp: BOSS_RULES.maxHp,
    attack: BOSS_RULES.attack,
    defense: BOSS_RULES.defense,
    initiative: BOSS_RULES.initiative,
    moveCooldown: BOSS_RULES.moveCooldown,
    attackCooldown: BOSS_RULES.attackCooldown,
    routeIndex,
    ambushZoneId: -1,
  }
}

/**
 * Lebt der Boss im Log noch? Geprüft wird über dieselbe Rollenerkennung wie
 * die Einheitenzählung, damit `bossAlive` und `monstersAlive` nicht
 * auseinanderlaufen können.
 */
export function isBossAlive(
  log: CombatLog,
  fallen: ReadonlySet<string>,
): boolean {
  return log.units.some((unit) => isBoss(unit) && !fallen.has(unit.id))
}
