import { afterEach, describe, expect, it } from 'vitest'
import { fixture } from '../src/fixture-data'
import { BALANCE } from '../src/village/balance'
import { type PlacedBuilding, workshopYield } from '../src/village/economy'
import {
  completeRaid,
  finishResult,
  startNight,
  triggerRaid,
} from '../src/village/phase-actions'
import { dayNight, resetDayNight, setPhase } from '../src/village/state'
import { FAILED, JOB } from './raid-fixtures'

/**
 * Die Tagesabrechnung am einzigen Schreibpfad des Dorf-Owners.
 *
 * Der Bestand wird hier direkt eingestellt statt über ein Baukommando: Geprüft
 * wird die Buchung selbst — einmal je Rückkehr, nie öfter —, und die Stufe eines
 * Gebäudes ist für sie der einzige Eingang. Grundrisse stehen deshalb als
 * Auffüllung dabei, ohne dass hier eine Lage geprüft würde.
 */

function mitGebaeuden(buildings: PlacedBuilding[]): void {
  dayNight.value = {
    ...dayNight.value,
    village: {
      ...dayNight.value.village,
      buildings: buildings.map((building, stelle) => ({
        ...building,
        footprint: { x: stelle * 3, y: 0, width: 2, height: 3 },
      })),
    },
  }
}

/** Der Materialzuwachs des Dorfes seit dem Startbestand. */
function materialzuwachs(): number {
  return (
    dayNight.value.village.resources.materials -
    BALANCE.start.resources.materials
  )
}

/**
 * Die Beute des Fixture-Laufs.
 *
 * Im Probelauf sterben beide Verteidiger: der Frostwolf trägt Stärke 2, der
 * Steingolem Stärke 5, beide in Generation 1. Die Stufen stehen absolut in
 * `sim-core/src/genome/strength.test.ts`, die Formel absolut in `loot.test.ts`;
 * hier ist die Naht dazwischen geprüft, deshalb rechnet dieser Wert mit der
 * Config statt mit einer zweiten abgeschriebenen Zahl.
 */
const FIXTURE_BEUTE = (2 + 5) * BALANCE.loot.goldPerOpponent

/** Der Goldzuwachs des Dorfes seit dem Startbestand. */
function goldzuwachs(): number {
  return dayNight.value.village.resources.gold - BALANCE.start.resources.gold
}

afterEach(() => {
  resetDayNight()
})

describe('Tagesabrechnung am einzigen Schreibpfad', () => {
  it('schreibt den Ertrag eines Tages genau einmal gut', () => {
    resetDayNight()
    mitGebaeuden([{ kind: 'workshop', level: 2 }])
    const erwartet = workshopYield(2, BALANCE)

    expect(startNight()).toBe(true)
    expect(triggerRaid()).toBe(true)
    expect(completeRaid(JOB)).toBe(true)
    expect(dayNight.value.daySettlement).toBeNull()
    expect(materialzuwachs()).toBe(0)

    expect(finishResult(JOB)).toBe(true)
    expect(dayNight.value.daySettlement).toEqual({
      day: fixture.day,
      gold: FIXTURE_BEUTE,
      materials: erwartet,
    })
    expect(materialzuwachs()).toBe(erwartet)
    expect(goldzuwachs()).toBe(FIXTURE_BEUTE)

    // Ein zweiter Rückkehrversuch scheitert an derselben Phase und bucht nichts.
    // Die Beute liegt auch hier vor: sonst verbürgte die Abweisung der fehlende
    // Lauf statt der verbrauchte Übergang.
    expect(setPhase('tag', [])).toBe(false)
    expect(materialzuwachs()).toBe(erwartet)
    expect(goldzuwachs()).toBe(FIXTURE_BEUTE)
  })

  it('schreibt auch dann gut, wenn der Auftrag gescheitert ist', () => {
    resetDayNight()
    mitGebaeuden([{ kind: 'workshop', level: 3 }])
    const erwartet = workshopYield(3, BALANCE)

    expect(startNight()).toBe(true)
    expect(triggerRaid()).toBe(true)
    expect(completeRaid(FAILED)).toBe(true)
    expect(dayNight.value.phase).toBe('result')
    // `finishResult` schickt einen gescheiterten Auftrag zurück in den Raid;
    // die Abrechnung hängt am Ausgang des Auftrags, nicht an seinem Status.
    // Ein gescheiterter Auftrag hat keinen Lauf, also auch keine Beute.
    expect(setPhase('tag', [])).toBe(true)
    expect(dayNight.value.day).toBe(fixture.day + 1)
    expect(dayNight.value.daySettlement?.gold).toBe(0)
    expect(materialzuwachs()).toBe(erwartet)
  })

  it('bucht auf dem Retry-Weg nichts erneut', () => {
    resetDayNight()
    mitGebaeuden([{ kind: 'workshop', level: 1 }])
    const erwartet = workshopYield(1, BALANCE)

    expect(startNight()).toBe(true)
    expect(triggerRaid()).toBe(true)
    expect(completeRaid(FAILED)).toBe(true)
    expect(finishResult(FAILED)).toBe(true)
    expect(dayNight.value.phase).toBe('raid')
    expect(dayNight.value.day).toBe(fixture.day)
    expect(dayNight.value.daySettlement).toBeNull()
    expect(materialzuwachs()).toBe(0)

    expect(completeRaid(JOB)).toBe(true)
    expect(finishResult(JOB)).toBe(true)
    expect(dayNight.value.day).toBe(fixture.day + 1)
    expect(materialzuwachs()).toBe(erwartet)
    // Der Lauf hat den Retry überlebt: derselbe Log, dieselbe Beute.
    expect(goldzuwachs()).toBe(FIXTURE_BEUTE)
  })

  it('weist den Tagesabschluss ohne Beute ab, statt 0 Gold zu buchen', () => {
    resetDayNight()
    mitGebaeuden([{ kind: 'workshop', level: 1 }])

    expect(startNight()).toBe(true)
    expect(setPhase('raid')).toBe(true)
    expect(setPhase('result')).toBe(true)
    // Ohne den zweiten Eingang ist der Übergang kein Abschluss: er wird
    // abgewiesen, und der Tag steht weiter auf der Ergebnisphase.
    expect(setPhase('tag')).toBe(false)
    expect(dayNight.value.phase).toBe('result')
    expect(dayNight.value.daySettlement).toBeNull()
    expect(materialzuwachs()).toBe(0)
    expect(goldzuwachs()).toBe(0)

    // Eine leere Liste dagegen ist eine Aussage über den Lauf und schließt ihn.
    expect(setPhase('tag', [])).toBe(true)
    expect(dayNight.value.day).toBe(fixture.day + 1)
    expect(dayNight.value.daySettlement).toEqual({
      day: fixture.day,
      gold: 0,
      materials: workshopYield(1, BALANCE),
    })
  })
})

describe('Startzustand des Dorf-Owners', () => {
  it('nimmt Ressourcen und Landbreite aus der Balance', () => {
    resetDayNight()
    expect(dayNight.value.village.resources).toEqual(BALANCE.start.resources)
    // Die beiden festen Startorte gehören zum selben Startbestand und stehen
    // mit ihren freigegebenen Zellen in `village-command-guards.test.ts`.
    expect(dayNight.value.village.landColumns).toBe(BALANCE.start.landColumns)
    // Etage 1 gehört zum Ausgang und ist keine Balancegröße, sondern der
    // Zählungsbeginn der Etagen.
    expect(dayNight.value.village.floors).toBe(1)
    expect(dayNight.value.daySettlement).toBeNull()
  })
})

describe('Eine kaputte Werkstattrechnung verdirbt den Bestand nicht', () => {
  it('bucht weder NaN noch einen Abzug gut', () => {
    for (const stufe of [Number.NaN, -1, 0, 2.5]) {
      resetDayNight()
      mitGebaeuden([{ kind: 'workshop', level: stufe }])
      const start = dayNight.value.village.resources.materials

      expect(startNight()).toBe(true)
      expect(triggerRaid()).toBe(true)
      expect(completeRaid(JOB)).toBe(true)
      expect(finishResult(JOB)).toBe(true)

      const bestand = dayNight.value.village.resources.materials
      expect(Number.isNaN(bestand)).toBe(false)
      expect(bestand).toBe(start)
      expect(dayNight.value.daySettlement).toEqual({
        day: fixture.day,
        gold: FIXTURE_BEUTE,
        materials: 0,
      })
    }
  })
})
