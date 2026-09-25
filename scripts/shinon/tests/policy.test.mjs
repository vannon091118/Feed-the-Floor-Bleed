import { describe, expect, it } from 'vitest'
import { SUPPORTED_POLICY_VERSION, parsePolicy } from '../policy-schema.mjs'
import { POLICY, loadPolicy, validateEnginePlugins } from '../policy.mjs'

function clonePolicy() {
  return JSON.parse(JSON.stringify(POLICY))
}

describe('policy schema', () => {
  it('akzeptiert die explizit unterstützte Policy-Version', () => {
    const result = parsePolicy(POLICY)
    expect(result.ok).toBe(true)
    expect(SUPPORTED_POLICY_VERSION).toBe(POLICY.version)
    expect(result.policy.version).toBe(SUPPORTED_POLICY_VERSION)
  })

  it('hält Engine-Trigger zentral in der Policy', () => {
    expect(POLICY.engine.always).toContain('schema-contract')
    expect(POLICY.engine.always).toContain('global-loc-gate')
    expect(POLICY.engine.slices['core-determinism'].prefixes).toContain(
      'packages/sim-core/',
    )
    expect(POLICY.engine.slices['false-positive'].contains).toContain(
      '/combat/',
    )
  })

  it('weist unbekannte Engine-Plugin-Namen zurück', () => {
    const input = clonePolicy()
    input.engine.always.push('typo-gate')
    const known = [
      ...input.engine.always.slice(0, -1),
      ...Object.keys(input.engine.slices),
    ]
    const result = validateEnginePlugins(input, known)
    expect(result.ok).toBe(false)
    expect(result.errors).toEqual(
      expect.arrayContaining([expect.stringContaining('typo-gate')]),
    )
  })

  it('meldet vorhandene Plugin-Dateien ohne Triggerzuordnung', () => {
    const known = [
      ...POLICY.engine.always,
      ...Object.keys(POLICY.engine.slices),
      'unconfigured-gate',
    ]
    const result = validateEnginePlugins(POLICY, known)
    expect(result.ok).toBe(false)
    expect(result.errors).toEqual(
      expect.arrayContaining([expect.stringContaining('unconfigured-gate')]),
    )
  })

  it('weist eine inkompatible Policy-Version kontrolliert zurück', () => {
    const input = clonePolicy()
    input.version = 2
    const result = loadPolicy(input)
    expect(result.ok).toBe(false)
    expect(result.usedFallback).toBe(false)
    expect(result.errors).toEqual(
      expect.arrayContaining([expect.stringContaining('Policy-Version 2')]),
    )
  })

  it('verwendet bei fehlerhafter Policy keinen stillen Fallback', () => {
    const result = loadPolicy({ version: 1 })
    expect(result.ok).toBe(false)
    expect(result.usedFallback).toBe(false)
    expect(result.policy).toBeUndefined()
    expect(result.errors).toEqual(
      expect.arrayContaining([expect.stringContaining('source')]),
    )
  })

  it('leitet den globalen Datei-Cap dynamisch aus den Ownership-Caps ab', () => {
    expect(POLICY.globalLoc.totalCap).toBeUndefined()
    expect(POLICY.globalLoc.fileCap).toBeUndefined()
    expect(
      Math.max(...POLICY.locCaps.map((entry) => entry.cap)),
    ).toBeGreaterThan(0)
  })

  it('meldet fehlende Pflichtfelder mit Feldpfad', () => {
    const input = clonePolicy()
    input.globalLoc.roots = 'packages'
    const result = parsePolicy(input)
    expect(result.ok).toBe(false)
    expect(result.errors).toEqual(
      expect.arrayContaining([expect.stringContaining('globalLoc.roots')]),
    )
  })

  it('meldet falsch typisierte Werte mit Feldpfad', () => {
    const input = clonePolicy()
    input.globalLoc.roots = 42
    const result = parsePolicy(input)
    expect(result.ok).toBe(false)
    expect(result.errors).toEqual(
      expect.arrayContaining([expect.stringContaining('globalLoc.roots')]),
    )
  })

  it('weist unbekannte Felder strikt zurück', () => {
    const input = clonePolicy()
    input.source.unexpected = true
    const result = parsePolicy(input)
    expect(result.ok).toBe(false)
    expect(result.errors).toEqual(
      expect.arrayContaining([expect.stringContaining('source.unexpected')]),
    )
  })
})
