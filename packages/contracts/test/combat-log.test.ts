import { describe, expect, it } from 'vitest'
import {
  CombatLogSchema,
  CombatSummarySchema,
  RaidLogPayloadSchema,
} from '../src'
import { combatLog, combatSummary, logPayload } from './raid-fixtures'

describe('Strikter Combat-Log', () => {
  it('akzeptiert den versionierten Ergebnislog und seine Summary', () => {
    expect(CombatLogSchema.safeParse(combatLog()).success).toBe(true)
    expect(CombatSummarySchema.safeParse(combatSummary()).success).toBe(true)
    expect(RaidLogPayloadSchema.safeParse(logPayload()).success).toBe(true)
  })

  it('übersteht einen JSON-Roundtrip verlustfrei', () => {
    const parsed = RaidLogPayloadSchema.parse(logPayload())
    const roundTrip = JSON.parse(JSON.stringify(parsed))
    expect(roundTrip).toEqual(parsed)
    expect(RaidLogPayloadSchema.safeParse(roundTrip).success).toBe(true)
  })

  it('lehnt unbekannte Felder und ungültige Hash-Formen ab', () => {
    expect(
      CombatLogSchema.safeParse({ ...combatLog(), engine: 'acme' }).success,
    ).toBe(false)
    expect(
      CombatLogSchema.safeParse({ ...combatLog(), hash: 'A1B2C3D4' }).success,
    ).toBe(false)
    expect(
      CombatLogSchema.safeParse({ ...combatLog(), hash: 'a1b2c3d' }).success,
    ).toBe(false)
  })

  it('verlangt ein schließendes end-Ereignis in der Ergebnisstufe', () => {
    const log = combatLog()
    const withoutEnd = { ...log, events: log.events.slice(0, 1) }
    expect(CombatLogSchema.safeParse(withoutEnd).success).toBe(false)
    const wrongStage = {
      ...log,
      events: log.events.map((event) =>
        event.type === 'end' ? { ...event, stage: 'running' as const } : event,
      ),
    }
    expect(CombatLogSchema.safeParse(wrongStage).success).toBe(false)
  })

  it('lehnt unbekannte Einheiten, doppelte IDs und Ticks hinter dem Ende ab', () => {
    const log = combatLog()
    const stranger = {
      ...log,
      events: log.events.map((event, index) =>
        index === 0 ? { ...event, actorId: 'ghost-9' } : event,
      ),
    }
    expect(CombatLogSchema.safeParse(stranger).success).toBe(false)
    const duplicate = {
      ...log,
      units: [log.units[0], { ...log.units[1], id: log.units[0].id }],
    }
    expect(CombatLogSchema.safeParse(duplicate).success).toBe(false)
    const lateEvent = {
      ...log,
      events: log.events.map((event) =>
        event.type === 'end' ? { ...event, tick: 6 } : event,
      ),
    }
    expect(CombatLogSchema.safeParse(lateEvent).success).toBe(false)
  })

  it('verlangt jede Einheit auf einer Trail-Zelle', () => {
    // Ohne diese Invariante liefe ein Replay in einen Indexfehler, weil der
    // Zustandsaufbau die Zone der Einheit über `trail[routeIndex]` liest.
    const log = combatLog()
    const offTrail = {
      ...log,
      units: log.units.map((unit) => ({
        ...unit,
        routeIndex: log.trail.length,
      })),
    }
    expect(CombatLogSchema.safeParse(offTrail).success).toBe(false)
    expect(CombatLogSchema.safeParse(log).success).toBe(true)
  })

  it('verlangt ein Verhalten und nur die vier Profile', () => {
    // Das Profil steht im Log, weil ein Replay ausschließlich den Log liest:
    // fehlte es, müsste die Zielentscheidung im Replay neu erfunden werden,
    // und ein erfundenes Profil wäre eine Entscheidung ohne Mechanik.
    const log = combatLog()
    const without = {
      ...log,
      units: log.units.map(({ behavior: _profil, ...unit }) => unit),
    }
    expect(CombatLogSchema.safeParse(without).success).toBe(false)
    const invented = {
      ...log,
      units: log.units.map((unit) => ({ ...unit, behavior: 'swarm' })),
    }
    expect(CombatLogSchema.safeParse(invented).success).toBe(false)
  })

  it('verlangt eine Klasse und nur die sechs Namen', () => {
    // Dieselbe Grenze wie beim Verhalten, aus demselben Grund: die Klasse steht
    // im Log, weil ein Replay ausschließlich den Log liest und eine Fähigkeit
    // sonst ohne ihren Auslöser dastünde.
    const log = combatLog()
    const without = {
      ...log,
      units: log.units.map(({ class: _klasse, ...unit }) => unit),
    }
    expect(CombatLogSchema.safeParse(without).success).toBe(false)
    const invented = {
      ...log,
      units: log.units.map((unit) => ({ ...unit, class: 'warlord' })),
    }
    expect(CombatLogSchema.safeParse(invented).success).toBe(false)
    const assigned = {
      ...log,
      units: log.units.map((unit) => ({ ...unit, class: 'vanguard' })),
    }
    expect(CombatLogSchema.safeParse(assigned).success).toBe(true)
  })

  it('kennt Fähigkeit und Aufdeckung als Ereignisarten', () => {
    const log = combatLog()
    const rewritten = (type: string) => ({
      ...log,
      events: log.events.map((event, index) =>
        index === 0 ? { ...event, type } : event,
      ),
    })
    expect(CombatLogSchema.safeParse(rewritten('ability')).success).toBe(true)
    expect(CombatLogSchema.safeParse(rewritten('reveal')).success).toBe(true)
    expect(CombatLogSchema.safeParse(rewritten('spell')).success).toBe(false)
  })

  it('hält die Summary geschlossen und typisiert', () => {
    const summary = combatSummary()
    expect(
      CombatSummarySchema.safeParse({ ...summary, extra: true }).success,
    ).toBe(false)
    expect(
      CombatSummarySchema.safeParse({ ...summary, events: 1.5 }).success,
    ).toBe(false)
    expect(
      CombatSummarySchema.safeParse({ ...summary, stage: 'draw' }).success,
    ).toBe(false)
    // `extracted` ist ein echtes Ergebnis der neuen Stufenliste und kein
    // Kampfergebnis: es steht hier, damit die Zusammenfassung es trägt.
    expect(
      CombatSummarySchema.safeParse({ ...summary, stage: 'extracted' }).success,
    ).toBe(true)
  })
})
