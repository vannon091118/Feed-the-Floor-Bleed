import type { Hero } from '../fixture-data'
import { fixture } from '../fixture-data'
import {
  type BuildingOutlook,
  buildingOutlooks,
  defenderSlots,
} from './building-outlook'
import { BUILDINGS } from './buildings'
import { type VillageHoldings, attractiveness, workerCapacity } from './economy'
import type { Loot } from './loot'
import type { Phase } from './phase'
import { dayNight } from './state'
import { type VillageState, treasury, usedPlots } from './treasury'

/** Farbton einer Karte. Die UI übersetzt das in eine Kante, nicht in Text. */
export type DistrictTone = 'idle' | 'accent' | 'ok' | 'alert'

/** Ein Ort im Dorf mit seinem aus der Schleife abgeleiteten Zustand. */
export interface VillageDistrict {
  id: string
  kind: string
  name: string
  state: string
  note: string
  tone: DistrictTone
  /** Belegung 0..1, wenn der Ort etwas zählbares belegt; sonst `null`. */
  share: number | null
}

/** Das Ergebnis der letzten Nacht: Status für den Ton, Detailtext aus dem Auftrag. */
export interface NightRecord {
  status: 'none' | 'completed' | 'failed' | 'expired'
  detail: string
}

/** Der Dorfblick als reine Ableitung über Wirtschaft, Phase und Roster. */
export interface VillageOutlook {
  name: string
  day: number
  phase: Phase
  tagline: string
  gold: number
  materials: number
  workers: number
  workerCapacity: number
  attractiveness: number
  plotsUsed: number
  plots: number
  districts: VillageDistrict[]
  buildings: BuildingOutlook[]
  roster: Hero[]
  lastNight: NightRecord
  pendingLoot: Loot | null
}

const TAGLINE: Record<Phase, string> = {
  tag: 'Die Gilde sammelt sich, das Tor ist offen.',
  night: 'Das Dorf schläft, der Plan steht.',
  raid: 'Die Gruppe ist unten.',
  result: 'Bilanz der Nacht.',
}

const HALL_STATE: Record<Phase, string> = {
  tag: 'Bürgermeister führt',
  night: 'Nacht ist vorbereitet',
  raid: 'Warten auf den Auftrag',
  result: 'Bilanz steht',
}

function tone(holdings: VillageHoldings, night: NightRecord): DistrictTone {
  if (holdings.gold < 0) return 'alert'
  if (night.status === 'failed' || night.status === 'expired') return 'alert'
  return 'idle'
}

function hall(state: VillageState, night: NightRecord): VillageDistrict {
  const { phase } = dayNight.value
  return {
    id: 'rathaus',
    kind: 'Verwaltung',
    name: 'Rathaus',
    state: HALL_STATE[phase],
    note: `Attraktivität ${attractiveness(state)} · Zuzug ab 50 Punkten`,
    tone: phase === 'tag' ? 'accent' : tone(state, night),
    share: null,
  }
}

function guild(state: VillageState): VillageDistrict {
  const ready = fixture.team.filter((hero) => hero.injury === 0).length
  const busy = BUILDINGS.reduce(
    (sum, def) => sum + (state.assignments[def.id] ?? 0),
    0,
  )
  return {
    id: 'gilde',
    kind: 'Heldentrupp',
    name: 'Gilde',
    state: `${ready} von ${fixture.team.length} einsatzbereit`,
    note: `${state.workers - busy} Arbeiter frei · Unterkunft bis ${workerCapacity(state)}`,
    tone: ready === fixture.team.length ? 'ok' : 'accent',
    share: null,
  }
}

function pen(state: VillageState): VillageDistrict {
  const filled = fixture.monsterSlots.filter((slot) => slot.monsterId).length
  const slots = defenderSlots(state)
  const free = slots - filled
  return {
    id: 'gehege',
    kind: 'Zucht',
    name: 'Verteidiger-Gehege',
    state: `${filled} von ${slots} Plätzen belegt`,
    note: free > 0 ? `${free} Plätze frei` : 'Alle Plätze belegt',
    tone: filled === 0 ? 'alert' : free > 0 ? 'accent' : 'ok',
    share: filled / slots,
  }
}

function nightRecord(): NightRecord {
  const job = dayNight.value.job
  if (!job)
    return { status: 'none', detail: 'Der erste Auftrag steht noch aus.' }
  if (job.status === 'completed') {
    const { heroesAlive, monstersAlive } = job.result.summary
    return {
      status: 'completed',
      detail: `${heroesAlive} Helden zurück · ${monstersAlive} Monster stehen.`,
    }
  }
  return {
    status: job.status,
    detail: job.error.detail ?? 'Der Auftrag ist offen geblieben.',
  }
}

/**
 * Liest Wirtschaft, Phase-Owner und Roster und liefert den Dorfblick. Reine
 * Funktion ohne eigenen Zustand: der Store schreibt, diese Ableitung liest.
 */
export function villageOutlook(): VillageOutlook {
  const { phase, day } = dayNight.value
  const state = treasury.value
  const lastNight = nightRecord()
  return {
    name: fixture.village,
    day,
    phase,
    tagline: TAGLINE[phase],
    gold: state.gold,
    materials: state.materials,
    workers: state.workers,
    workerCapacity: workerCapacity(state),
    attractiveness: attractiveness(state),
    plotsUsed: usedPlots(state),
    plots: state.plots,
    districts: [hall(state, lastNight), guild(state), pen(state)],
    buildings: buildingOutlooks(state),
    roster: fixture.team,
    lastNight,
    pendingLoot: state.pendingLoot,
  }
}
