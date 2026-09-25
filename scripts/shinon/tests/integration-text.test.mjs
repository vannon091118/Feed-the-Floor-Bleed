import { describe, expect, it } from 'vitest'
import { checkMessage } from '../lib/commit-text.mjs'
import {
  buildIntegrationBody,
  buildIntegrationMessage,
  integrationLabel,
} from '../lib/integration-text.mjs'

const FILES = [
  'packages/client/src/world/tiles.ts',
  'scripts/shinon/policy.json',
]

describe('Integrations-Text', () => {
  it('erzeugt einen gate-konformen Merge-Body', () => {
    const { text } = buildIntegrationMessage({
      action: 'merge',
      target: 'origin/main',
      files: FILES,
    })
    const result = checkMessage(text, FILES)
    expect(result.ok).toBe(true)
    expect(result.words).toBeGreaterThanOrEqual(200)
  })

  it('erzeugt einen gate-konformen Pull-Request-Body', () => {
    const { text } = buildIntegrationMessage({
      action: 'pr',
      target: 'main',
      files: FILES,
    })
    const result = checkMessage(text, FILES)
    expect(result.ok).toBe(true)
    expect(result.words).toBeGreaterThanOrEqual(200)
  })

  it('nennt jede Datei und keine Dublette', () => {
    const body = buildIntegrationBody({
      action: 'rebase',
      target: 'origin/main',
      files: [...FILES, FILES[0]],
    })
    expect(body).toContain(FILES[0])
    expect(body).toContain(FILES[1])
    expect(body.split(FILES[0])).toHaveLength(2)
  })

  it('übersetzt unbekannte Aktionen unverändert', () => {
    expect(integrationLabel('merge')).toBe('Merge')
    expect(integrationLabel('custom')).toBe('custom')
  })
})
