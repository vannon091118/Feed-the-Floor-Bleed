import { fixture } from '../fixture-data'

/**
 * Sprechende Beschriftung für eine Kennung aus Roster oder Verteidiger-Gehege.
 *
 * Die Oberfläche zeigt keine `hero-mara` und keine `monster-frost-2`, sondern
 * Namen und Zählung. Kennungen bleiben im Datenmodell, nicht im Bildschirm.
 */
export function actorLabel(id: string): string {
  const hero = fixture.team.find((entry) => entry.id === id)
  if (hero) return hero.name
  const [, kind = 'Kreatur', index] = id.split('-')
  return index ? `${kind} ${index}` : kind
}
