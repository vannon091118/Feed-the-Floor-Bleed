export interface Resources {
  gold: number
  materials: number
}

export interface Hero {
  name: string
  role: string
  hp: number
  injury: number
}

export interface FixtureData {
  village: string
  day: number
  workers: number
  attractiveness: number
  resources: Resources
  team: Hero[]
}

export const fixture: FixtureData = {
  village: 'Frosthalde',
  day: 18,
  workers: 12,
  attractiveness: 74,
  resources: { gold: 120, materials: 7 },
  team: [
    { name: 'Mara', role: 'Späherin', hp: 42, injury: 0 },
    { name: 'Bram', role: 'Brecher', hp: 56, injury: 1 },
    { name: 'Nell', role: 'Heilerin', hp: 38, injury: 0 },
  ],
}
