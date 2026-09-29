import type { BaseMonster } from './types'

/**
 * Die zweiten zehn Basis-Monster.
 *
 * **Die Zahlen sind `[K]`** — dieselbe Lage wie in `roster-a.ts`, siehe dort.
 *
 * `roster-a.ts` und diese Datei teilen sich die Zwanzig: eine Datei mit dem
 * ganzen Pool wäre eine reine Datenwand. Die Registry führt beide Listen
 * zusammen und prüft die Regeln, ohne sie hier doppelt zu zählen.
 *
 * **Die Archetypen sind `[K]`**, siehe `roster-a.ts`. Dieses Roster trägt zwei
 * Tanks, einen Schadensling, drei Stützen, einen Hinterhalter und zwei Schwarm-
 * Wesen; zusammen mit A ergibt das sechs Tanks und sechzehn weitere Wesen in
 * fünf Rollen.
 */
export const ROSTER_B: readonly BaseMonster[] = [
  {
    id: 'peat-crawler',
    name: 'Torfkriecher',
    palette: [0x7a7050, 0x50492f, 0xbdb37e],
    elements: [3900, 4300, 6000],
    trait: 'heavyTread',
    bonus: 'endurance',
    archetype: 'controller',
  },
  {
    id: 'mire-witch',
    name: 'Moorhexe',
    palette: [0x8c6ca8, 0x5c4470, 0xd4b8e8],
    elements: [3300, 6400, 4400],
    trait: 'deepLungs',
    bonus: 'precision',
    archetype: 'support',
  },
  {
    id: 'ash-revenant',
    name: 'Aschgespenst',
    palette: [0xa09898, 0x6e6868, 0xe0d8d8],
    elements: [4600, 3800, 7000],
    trait: 'focused',
    bonus: 'vitality',
    archetype: 'support',
  },
  {
    id: 'bramble-guard',
    name: 'Dornenwache',
    palette: [0x6f8a4e, 0x475c31, 0xc0d894],
    elements: [8100, 2900, 4800],
    trait: 'toughHide',
    bonus: 'bulwark',
    archetype: 'tank',
  },
  {
    id: 'shard-imp',
    name: 'Scherbenteufel',
    palette: [0xd4708c, 0xa04258, 0xffc4d0],
    elements: [2900, 5500, 2200],
    trait: 'keenEdge',
    bonus: 'frenzy',
    archetype: 'swarm',
  },
  {
    id: 'deep-lurker',
    name: 'Tiefenlauer',
    palette: [0x4f7f8c, 0x2f5560, 0xa0d4e0],
    elements: [6400, 4700, 6700],
    trait: 'restless',
    bonus: 'swiftness',
    archetype: 'damage',
  },
  {
    id: 'bone-elder',
    name: 'Knochenältester',
    palette: [0xc8c0a8, 0x8c8570, 0xeee6d0],
    elements: [5700, 6200, 3500],
    trait: 'focused',
    bonus: 'vitality',
    archetype: 'support',
  },
  {
    id: 'frost-herald',
    name: 'Frostherold',
    palette: [0x9ec8dc, 0x6a94a8, 0xdff2fa],
    elements: [5000, 8100, 4900],
    trait: 'deepLungs',
    bonus: 'precision',
    archetype: 'controller',
  },
  {
    id: 'ember-titan',
    name: 'Glutkolos',
    palette: [0xc85c34, 0x8c3a1c, 0xffb878],
    elements: [9200, 5100, 7600],
    trait: 'heavyTread',
    bonus: 'bulwark',
    archetype: 'tank',
  },
  {
    id: 'shade-prowler',
    name: 'Schattenläufer',
    palette: [0x54506a, 0x322f42, 0xb0aac4],
    elements: [3500, 3900, 2100],
    trait: 'restless',
    bonus: 'precision',
    archetype: 'ambusher',
  },
]
