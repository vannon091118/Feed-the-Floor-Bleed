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
export const BOSS_ROLE = 'boss' as const

/**
 * Ausgangswerte des Bosses. Wie die Werte der Helden und Monster vorläufig und
 * nicht abgenommen (`[K]` in `docs/CONCEPT_REVIEW.md`).
 */
export const BOSS_RULES = {
  maxHp: toFixed(200),
  attack: toFixed(16),
  defense: toFixed(5),
  initiative: 700,
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
