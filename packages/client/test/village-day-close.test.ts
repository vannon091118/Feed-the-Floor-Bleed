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
      materials: erwartet,
    })
    expect(materialzuwachs()).toBe(erwartet)

    // Ein zweiter Rückkehrversuch scheitert an derselben Phase und bucht nichts.
    expect(setPhase('tag')).toBe(false)
    expect(materialzuwachs()).toBe(erwartet)
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
    expect(setPhase('tag')).toBe(true)
    expect(dayNight.value.day).toBe(fixture.day + 1)
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
  })
})

describe('Startzustand des Dorf-Owners', () => {
  it('nimmt Ressourcen und Landbreite aus der Balance', () => {
    resetDayNight()
    expect(dayNight.value.village.resources).toEqual(BALANCE.start.resources)
    expect(dayNight.value.village.buildings).toEqual([])
    expect(dayNight.value.village.landColumns).toBe(BALANCE.start.landColumns)
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
        materials: 0,
      })
    }
  })
})
