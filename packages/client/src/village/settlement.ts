import { fixture } from '../fixture-data'
import type { Hero } from '../fixture-data'
import type { Phase } from './phase'
import { dayNight } from './state'

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

/**
 * Der Dorfblick als reine Ableitung.
 *
 * Grundlage sind ausschließlich der Phase-Owner und die Fixture-Daten; es
 * gibt hier keinen zweiten Dorfzustand, keine Arbeiterverteilung und keine
 * Wirtschaft. `note` kennzeichnet die Startbasis ausdrücklich als solche, damit
 * die Oberfläche nichts als veränderlich ausgibt, was es nicht ist.
 */
export interface VillageOutlook {
  name: string
  day: number
  phase: Phase
  tagline: string
  districts: VillageDistrict[]
  /** Die Gilde. Keine Kopie: der Roster-Owner bleibt `fixture-data`. */
  roster: Hero[]
  lastNight: NightRecord
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

function hallTone(phase: Phase, lastNight: NightRecord): DistrictTone {
  if (phase === 'tag') return 'accent'
  if (lastNight.status === 'failed' || lastNight.status === 'expired') {
    return 'alert'
  }
  return 'idle'
}

function hall(): VillageDistrict {
  const { phase } = dayNight.value
  return {
    id: 'rathaus',
    kind: 'Verwaltung',
    name: 'Rathaus',
    state: HALL_STATE[phase],
    note: `Startbasis: ${fixture.workers} Arbeiter · Attraktivität ${fixture.attractiveness}`,
    tone: hallTone(phase, nightRecord()),
    share: null,
  }
}

function guild(): VillageDistrict {
  const ready = fixture.team.filter((hero) => hero.injury === 0).length
  const fatigue = fixture.team.reduce((sum, hero) => sum + hero.fatigue, 0)
  return {
    id: 'gilde',
    kind: 'Heldentrupp',
    name: 'Gilde',
    state: `${ready} von ${fixture.team.length} einsatzbereit`,
    note:
      ready === fixture.team.length
        ? 'Keine Verletzten aus der letzten Nacht'
        : `${fixture.team.length - ready} verletzt · Müdigkeit gesamt ${fatigue}`,
    tone: ready === fixture.team.length ? 'ok' : 'accent',
    share: null,
  }
}

function pen(): VillageDistrict {
  const total = fixture.monsterSlots.length
  const filled = fixture.monsterSlots.filter((slot) => slot.monsterId).length
  const free = total - filled
  return {
    id: 'gehege',
    kind: 'Zucht',
    name: 'Verteidiger-Gehege',
    state: `${filled} von ${total} Plätzen belegt`,
    note: free > 0 ? `${free} Plätze frei` : 'Keine freien Plätze',
    tone: filled === 0 ? 'alert' : free > 0 ? 'accent' : 'ok',
    share: filled / total,
  }
}

function nightRecord(): NightRecord {
  const job = dayNight.value.job
  if (!job) {
    return { status: 'none', detail: 'Der erste Auftrag steht noch aus.' }
  }
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
 * Liest den Phase-Owner und die Fixture und liefert den Dorfblick. Reine
 * Funktion ohne eigenen Zustand: jeder Aufrufer sieht dieselbe Ableitung.
 */
export function villageOutlook(): VillageOutlook {
  const { phase, day } = dayNight.value
  return {
    name: fixture.village,
    day,
    phase,
    tagline: TAGLINE[phase],
    districts: [hall(), guild(), pen()],
    roster: fixture.team,
    lastNight: nightRecord(),
  }
}
