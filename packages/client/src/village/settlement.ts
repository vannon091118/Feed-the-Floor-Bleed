import type { Hero } from '../fixture-data'
import { fixture } from '../fixture-data'
import type { Phase } from './phase'
import { dayNight } from './state'

/**
 * Der Dorfblick als reine Ableitung.
 *
 * Grundlage sind ausschließlich der Phase-Owner und die Fixture-Daten; es
 * gibt hier keinen zweiten Dorfzustand, keine Arbeiterverteilung und keine
 * Wirtschaft.
 */
export interface VillageOutlook {
  name: string
  day: number
  phase: Phase
  tagline: string
  /** Die Gilde. Keine Kopie: der Roster-Owner bleibt `fixture-data`. */
  roster: Hero[]
}

const TAGLINE: Record<Phase, string> = {
  tag: 'Die Gilde sammelt sich, das Tor ist offen.',
  night: 'Das Dorf schläft, der Plan steht.',
  raid: 'Die Gruppe ist unten.',
  result: 'Bilanz der Nacht.',
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
    roster: fixture.team,
  }
}
