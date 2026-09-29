import { describe, expect, it } from 'vitest'
import { ARCHETYPE_IDS, type ArchetypeId, baseMonsters } from '../genome'
import { createDungeonGrid } from '../grid'
import { defaultCombatConfig, resolveCombat } from './index'

/**
 * Messwerkzeug für die Kampfbalance — bewusst kein Sollwert.
 *
 * Es schreibt keinen Siegquoten-Zielwert fest. Es misst und druckt die Tabelle,
 * aus der der Auftraggeber das Zielband nennt; ein Test, der ein gewünschtes
 * Ergebnis pinnt, wäre die Fehlerquelle mit grüner Anzeige.
 *
 * Die Standardbreite hält den Gate-Lauf klein. Für eine belastbare Messung
 * `BALANCE_SEEDS=500 pnpm vitest run packages/sim-core/src/combat/balance-report.test.ts`
 * laufen lassen.
 */
const SEEDS = Number(process.env.BALANCE_SEEDS ?? 32)
const SLOTS = [0, 1, 2, 3, 4, 5] as const
const TEAM_SIZE = 3
const STAGES = ['heroes-win', 'monsters-win', 'timeout'] as const

type Stage = (typeof STAGES)[number]

/** Eine Tabellenzeile in Prozent. Gerundet, also nicht zur Addition geeignet. */
interface Row {
  Plätze: number
  Helden: number
  Boss: number
  Zeitlimit: number
  'Ø Ticks': number
}

/** Die ersten n Arten des Pools, in Slot-Reihenfolge. */
function defenders(count: number): { baseId: string }[] {
  return baseMonsters()
    .slice(0, count)
    .map((base) => ({ baseId: base.id }))
}

function run(monsterSlots: number, seed: number) {
  return fight(defenders(monsterSlots), seed)
}

function fight(defenders: { baseId: string }[], seed: number) {
  return resolveCombat({
    grid: createDungeonGrid(),
    seed,
    teamSize: TEAM_SIZE,
    defenders,
    config: defaultCombatConfig(),
  })
}

function measure(monsterSlots: number) {
  const stages: Record<Stage, number> = {
    'heroes-win': 0,
    'monsters-win': 0,
    timeout: 0,
  }
  let ticks = 0
  for (let seed = 0; seed < SEEDS; seed += 1) {
    const log = run(monsterSlots, seed)
    if (!STAGES.includes(log.stage))
      throw new Error(`Unbekannte Stufe ${log.stage}`)
    stages[log.stage] += 1
    ticks += log.ticks
  }
  const percent = (value: number) => Math.round((value / SEEDS) * 100)
  const row: Row = {
    Plätze: monsterSlots,
    Helden: percent(stages['heroes-win']),
    Boss: percent(stages['monsters-win']),
    Zeitlimit: percent(stages.timeout),
    'Ø Ticks': Math.round(ticks / SEEDS),
  }
  return { row, stages }
}

describe('Kampfbalance-Messung', () => {
  it('misst die Stufenverteilung über Seeds und Verteidigerplätze', () => {
    const measurements = SLOTS.map(measure)
    console.table(measurements.map((measurement) => measurement.row))
    console.log(
      `Grundlage: ${SEEDS} Seeds je Zeile, Teamgröße ${TEAM_SIZE}, offenes Fixture-Grid, Standardregeln.`,
    )
    for (const { stages } of measurements) {
      const total =
        stages['heroes-win'] + stages['monsters-win'] + stages.timeout
      expect(total).toBe(SEEDS)
    }
  })

  it('bleibt bei gleichem Seed und gleicher Belegung deterministisch', () => {
    for (const slots of SLOTS) {
      const first = run(slots, 7)
      const second = run(slots, 7)
      expect(second.hash).toBe(first.hash)
      expect(second.stage).toBe(first.stage)
    }
  })
})

/** Eine Messzeile je Rolle: die Arten dieser Rolle im einzelnen Verteidigerplatz. */
interface ArchetypZeile {
  Rolle: string
  Arten: number
  'Helden %': number
  'Monster %': number
  'Zeitlimit %': number
  'Ø Ticks': number
}

/**
 * Die Gewichtung der sechs Rollen, gemessen statt gesetzt.
 *
 * Jede Art ihrer Rolle steht einzeln im Verteidigerplatz, jede mit derselben
 * Seed-Zahl; gezählt wird über alle Läufe der Rolle hinweg. Damit antwortet
 * die Tabelle auf eine Frage, die die Zähler-Frage nicht beantwortet: ob die
 * Tank-Rollung wirklich schwerer ist als die Schwarm-Rolle, oder ob nur die
 * Artenzahl den Unterschied macht.
 */
function missArchetyp(archetype: ArchetypeId): ArchetypZeile {
  const roster = baseMonsters().filter((base) => base.archetype === archetype)
  const stages: Record<Stage, number> = {
    'heroes-win': 0,
    'monsters-win': 0,
    timeout: 0,
  }
  let ticks = 0
  for (const base of roster) {
    for (let seed = 0; seed < SEEDS; seed += 1) {
      const log = fight([{ baseId: base.id }], seed)
      stages[log.stage] += 1
      ticks += log.ticks
    }
  }
  const laeufe = SEEDS * roster.length
  const percent = (value: number) => Math.round((value / laeufe) * 100)
  return {
    Rolle: archetype,
    Arten: roster.length,
    'Helden %': percent(stages['heroes-win']),
    'Monster %': percent(stages['monsters-win']),
    'Zeitlimit %': percent(stages.timeout),
    'Ø Ticks': Math.round(ticks / laeufe),
  }
}

describe('Archetypen-Gewichtung', () => {
  it('misst jede der sechs Rollen im einzelnen Verteidigerplatz', () => {
    const zeilen = ARCHETYPE_IDS.map(missArchetyp)
    console.table(zeilen)
    console.log(
      `Grundlage: ${SEEDS} Seeds je Art im Einzelplatz, Teamgröße ${TEAM_SIZE}. Die Prozentzahlen sind gerundet und deshalb nicht summierbar.`,
    )
    for (const zeile of zeilen) {
      expect(zeile.Arten).toBeGreaterThan(0)
    }
  })
})
