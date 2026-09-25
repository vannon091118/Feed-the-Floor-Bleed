export interface Resources {
  gold: number
  materials: number
}

export interface Hero {
  id: string
  name: string
  role: string
  hp: number
  fatigue: number
  injury: number
  tactics: string[]
}

export interface MonsterSlot {
  monsterId: string | null
}

export interface FixtureData {
  village: string
  day: number
  workers: number
  attractiveness: number
  resources: Resources
  team: Hero[]
  monsterSlots: MonsterSlot[]
}

/**
 * Feste Auftragsdaten des Fixture-Raids.
 *
 * `createdAt` und `observedAt` sind bewusst Konstanten und keine Uhrzeit: der
 * lokale Probelauf muss reproduzierbar bleiben. Die Fristprüfung sitzt im
 * Core, der Client liefert nur die Vergleichswerte.
 */
export const fixtureRaid = {
  jobId: 'fixture-raid-1',
  seed: 4242,
  floor: 1,
  createdAt: 0,
  observedAt: 1,
}

export const fixture: FixtureData = {
  village: 'Frosthalde',
  day: 18,
  workers: 12,
  attractiveness: 74,
  resources: { gold: 120, materials: 7 },
  team: [
    {
      id: 'hero-mara',
      name: 'Mara',
      role: 'Späherin',
      hp: 42,
      fatigue: 2,
      injury: 0,
      tactics: ['scout', 'retreat'],
    },
    {
      id: 'hero-bram',
      name: 'Bram',
      role: 'Brecher',
      hp: 56,
      fatigue: 0,
      injury: 1,
      tactics: ['hold'],
    },
    {
      id: 'hero-nell',
      name: 'Nell',
      role: 'Heilerin',
      hp: 38,
      fatigue: 1,
      injury: 0,
      tactics: ['guard', 'mend'],
    },
  ],
  // Verteidiger-Roster ist Fixture-Daten, keine Gameplay-Ableitung: T1.3
  // serialisiert den Auftrag, es erfindet noch keine Zucht.
  monsterSlots: [
    { monsterId: 'monster-frost-1' },
    { monsterId: 'monster-frost-2' },
    { monsterId: null },
    { monsterId: null },
    { monsterId: null },
  ],
}
