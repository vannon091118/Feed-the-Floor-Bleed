import type { TerminalRaidJob } from '@floor/contracts'
import { signal } from '@preact/signals'
import { fixture } from '../fixture-data'
import { BUILDINGS, type BuildingId, buildingById } from './buildings'
import {
  type DayReport,
  type VillageHoldings,
  canAfford,
  levelOf,
  settleDay,
  workerCapacity,
} from './economy'
import { type Loot, lootFromJob } from './loot'
import { dayNight } from './state'

/**
 * Wie viele Gebäudearten gleichzeitig stehen dürfen.
 *
 * Drei, weil das Rathaus bereits steht und es nur vier Arten gibt: dadurch
 * bindet die Grenze wirklich und ist eine Entscheidung statt einer Zahl, die
 * nie erreicht wird.
 */
export const PLOTS = 3

/** Alles, was das Dorf besitzt und was die Wirtschaft verändert. */
export interface VillageState extends VillageHoldings {
  plots: number
  /** Ware aus dem letzten Auftrag, die noch nicht verkauft ist. */
  pendingLoot: Loot | null
}

/** Ergebnis einer Aktion: trägt die Rückmeldung für die Oberfläche. */
export type ActionResult =
  | { ok: true; message: string }
  | { ok: false; message: string }

function refuse(message: string): ActionResult {
  return { ok: false, message }
}

function initialState(): VillageState {
  return {
    gold: fixture.resources.gold,
    materials: fixture.resources.materials,
    workers: fixture.workers,
    levels: { rathaus: 1 },
    assignments: {},
    plots: PLOTS,
    pendingLoot: null,
  }
}

/** Der einzige Owner von Ressourcen, Gebäuden, Arbeitern und offener Beute. */
export const treasury = signal<VillageState>(initialState())

/** Wie viele Gebäudearten bereits stehen. */
export function usedPlots(state: VillageState): number {
  return BUILDINGS.filter((def) => levelOf(state, def.id) > 0).length
}

function write(patch: Partial<VillageState>): void {
  treasury.value = { ...treasury.value, ...patch }
}

/**
 * Baut ein Gebäude auf der nächsten Stufe oder stellt es zum ersten Mal her.
 *
 * Bauen ist eine Amtshandlung des Tages: in jeder anderen Phase wird sie
 * abgelehnt, damit die Nacht kein stiller Umbau wird. Ein Erstbau braucht
 * einen freien Bauplatz, ein Ausbau nicht.
 */
export function buildBuilding(id: BuildingId): ActionResult {
  if (dayNight.value.phase !== 'tag')
    return refuse('Gebaut wird nur am Tag, wenn das Dorf regiert.')
  const state = treasury.value
  const def = buildingById(id)
  const level = levelOf(state, id)
  if (level >= def.maxLevel)
    return refuse(`${def.name} steht bereits auf der höchsten Stufe.`)
  if (level === 0 && usedPlots(state) >= state.plots)
    return refuse('Alle Bauplätze sind belegt.')
  const afford = canAfford(state, id)
  if (!afford.ok) {
    const fehlt = [
      afford.missing.gold > 0 ? `${afford.missing.gold} Gold` : null,
      afford.missing.materials > 0
        ? `${afford.missing.materials} Material`
        : null,
    ].filter((part): part is string => part !== null)
    return refuse(`Zu wenig Vorrat: ${fehlt.join(' und ')} fehlen.`)
  }
  write({
    levels: { ...state.levels, [id]: level + 1 },
    gold: state.gold - afford.cost.gold,
    materials: state.materials - afford.cost.materials,
  })
  return {
    ok: true,
    message: `${def.name} steht jetzt auf Stufe ${level + 1} für ${afford.cost.gold} Gold und ${afford.cost.materials} Material.`,
  }
}

/** Besetzt einen freien Arbeitsplatz in einem Gebäude. */
export function assignWorker(id: BuildingId): ActionResult {
  if (dayNight.value.phase !== 'tag')
    return refuse('Arbeiter werden nur am Tag eingeteilt.')
  const state = treasury.value
  const def = buildingById(id)
  const assigned = state.assignments[id] ?? 0
  if (levelOf(state, id) === 0) return refuse(`${def.name} steht noch nicht.`)
  if (assigned >= def.workerSlotsPerLevel * levelOf(state, id))
    return refuse(`${def.name} hat keinen freien Arbeitsplatz.`)
  const idle = state.workers - totalAssigned(state)
  if (idle <= 0) return refuse('Kein Arbeiter ist frei.')
  write({ assignments: { ...state.assignments, [id]: assigned + 1 } })
  return {
    ok: true,
    message: `Ein Arbeiter arbeitet jetzt in der ${def.name}.`,
  }
}

/** Nimmt einen Arbeiter aus einem Gebäude zurück in den freien Bestand. */
export function releaseWorker(id: BuildingId): ActionResult {
  const state = treasury.value
  const assigned = state.assignments[id] ?? 0
  if (assigned === 0) return refuse('In diesem Gebäude arbeitet niemand.')
  write({ assignments: { ...state.assignments, [id]: assigned - 1 } })
  return { ok: true, message: 'Ein Arbeiter ist wieder frei.' }
}

function totalAssigned(state: VillageState): number {
  return BUILDINGS.reduce(
    (sum, def) => sum + (state.assignments[def.id] ?? 0),
    0,
  )
}

/**
 * Legt die Beute des Auftrags zum Verkauf bereit.
 *
 * Ein neuer Auftrag ersetzt die offene Ware, damit nach einem Retry nicht
 * zweimal dieselbe Beute im Haus liegt.
 */
export function depositLoot(job: TerminalRaidJob): void {
  write({ pendingLoot: lootFromJob(job) })
}

/** Verkauft die offene Ware. Löhne und Ertrag laufen erst am Tagesabschluss. */
export function sellLoot(): ActionResult {
  if (dayNight.value.phase !== 'result')
    return refuse('Verkauft wird im Ergebnis, wenn der Auftrag feststeht.')
  const state = treasury.value
  if (!state.pendingLoot)
    return refuse('Es liegt keine Beute zum Verkauf bereit.')
  const { gold, materials } = state.pendingLoot
  write({
    gold: state.gold + gold,
    materials: state.materials + materials,
    pendingLoot: null,
  })
  return {
    ok: true,
    message: `Verkauft: ${gold} Gold und ${materials} Material eingenommen.`,
  }
}

/** Rechnet einen Tag ab: Ertrag, Löhne und Zuzug. Wird am Tagesabschluss gerufen. */
export function settleVillageDay(): DayReport {
  const state = treasury.value
  const freeCapacity = Math.max(0, workerCapacity(state) - state.workers)
  const report = settleDay(state, freeCapacity)
  write({
    gold: state.gold + report.gold,
    materials: state.materials + report.materials,
    workers: state.workers + report.recruits,
  })
  return report
}

/** Test- und Demo-Hilfe: exakt der Startzustand des Dorfes. */
export function resetTreasury(): void {
  treasury.value = initialState()
}
