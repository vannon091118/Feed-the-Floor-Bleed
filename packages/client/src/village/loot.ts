import type { FrozenBalance } from './balance'

/**
 * Die Goldformel der Run-Beute.
 *
 * Sie steht in ihrer eigenen Datei und nicht in `economy.ts`, weil sie eine
 * andere Frage beantwortet: `economy` beantwortet, was ein Dorf **kostet**,
 * diese Regel, was ein **gefallener Gegner einbringt**. Beide nehmen ihre
 * Balance ausdrücklich entgegen und rechnen ohne Zustand.
 *
 * Die Regel ist am 2026-09-29 freigegeben (`[N]`) und in `docs/GOLDFORMEL.md`
 * mit Beispieltabelle und Grenzfällen begründet. Die Zahlen selbst stehen in
 * `balance.ts` unter `loot` — hier steht keine einzige.
 */

/** Ein gefallener Gegner, wie ihn die Beuteabrechnung kennt. */
export interface FallenOpponent {
  /** Die Stärke des Wesens; 0 trägt 0 Gold bei. */
  strength: number
  /** Die Generation des Wesens; ab 1, sonst ist der Gegner ungültig. */
  generation: number
}

/** Warum ein Gegner nicht in die Beute eingeht. */
export type OpponentRejection =
  | { ok: false; reason: 'not-whole-strength'; strength: number }
  | { ok: false; reason: 'below-first-generation'; generation: number }
  | { ok: true; gold: number }

/**
 * Das Gold eines einzelnen gefallenen Gegners.
 *
 * `floor` auf ganze Stücke, damit es keine Goldbruchteile gibt: das Bestandsfeld
 * ist ein Ganzzahlfeld im Contract, und eine gebrochene Zahl käme dort als
 * unbekannter Zustand an.
 *
 * Eine Stärke von 0 trägt 0 bei, ist aber **kein** Fehler — ein Wesen ohne
 * Stärke ist geschlagen, nicht ungültig. Eine Generation unter 1 dagegen schon:
 * sie bedeutet, dass der Bestand keinen gültigen Gegner führt, und eine Summe
 * darüber wäre eine Beute aus nichts.
 */
export function goldForOpponent(
  opponent: FallenOpponent,
  config: FrozenBalance,
): OpponentRejection {
  const { strength, generation } = opponent
  if (!Number.isInteger(strength) || strength < 0) {
    return { ok: false, reason: 'not-whole-strength', strength }
  }
  if (!Number.isInteger(generation) || generation < 1) {
    return { ok: false, reason: 'below-first-generation', generation }
  }
  const { goldPerOpponent, generationStepPermille } = config.loot
  const step = 1000 + generationStepPermille * (generation - 1)
  return {
    ok: true,
    gold: Math.floor((goldPerOpponent * strength * step) / 1000),
  }
}

/**
 * Das Gold eines Runs, summiert über die gefallenen Gegner.
 *
 * Ein abgewiesener Gegner macht den ganzen Run ungültig, statt still zu zählen:
 * eine halbe Beute, die so aussieht wie eine ganze, wäre im Bestand nicht mehr
 * von einer echten zu unterscheiden. Das leere Ergebnis ist 0 Gold, auch bei
 * einem Sieg über den Boss allein — der Boss ist kein Goldträger.
 */
export function goldForRun(
  fallen: readonly FallenOpponent[],
  config: FrozenBalance,
): { ok: true; gold: number } | { ok: false; reason: OpponentRejection } {
  let gold = 0
  for (const opponent of fallen) {
    const result = goldForOpponent(opponent, config)
    if (!result.ok) return { ok: false, reason: result }
    gold += result.gold
  }
  return { ok: true, gold }
}
