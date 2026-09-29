import type { BaseMonster } from './types'

/**
 * Die ersten zehn Basis-Monster.
 *
 * **Die Zahlen sind `[K]`.** Weder die Elementwerte noch die Wahl der Arten
 * und ihrer Eigenschaften sind freigegeben; `docs/VISUAL_GRUNDSATZ.md` führt
 * die Kampfbalance ausdrücklich als offen. Die Werte stammen aus der
 * Spieldesign-Aussage vom 2026-09-29 und sind hier als **Startbasis**
 * eingetragen, damit die Mechanik prüfbar ist — nicht, weil sie abgenommen
 * wären. Vor einer Freigabe der Kampfbalance gehören sie ersetzt.
 *
 * Die Elemente sind der erbliche Kern: kein Monst set ist eine Umkopie der
 * anderen, und die Paare unterscheiden sich so, dass die Kopplung in
 * `mutation.ts` verschiedene Wesen erzeugt. Ein „Wolfsgezücht" mit hohem
 * Angriff und niedriger Zähigkeit ist damit ein anderer Kampf als ein
 * „Kiesling" mit hohem Angriff und hoher Zähigkeit.
 *
 * **Die Archetypen sind ebenfalls `[K]`.** Sie sind aus dem Zahlenprofil
 * abgelesen und nicht aus einer abgenommenen Rollenliste: dieses Roster trägt
 * vier Tanks, drei Schadenslinge, zwei Hinterhalter und einen Schwarm. Die
 * Verteilung ist damit Teil der offenen Kampfbalance, nicht ihr Ergebnis —
 * `combat/balance-report.test.ts` misst sie.
 */
export const ROSTER_A: readonly BaseMonster[] = [
  {
    id: 'frost-wolf',
    name: 'Frostwolf',
    palette: [0x8fb8d8, 0x5f88ad, 0xd6f0ff],
    elements: [4200, 6800, 3100],
    trait: 'restless',
    bonus: 'frenzy',
    archetype: 'ambusher',
  },
  {
    id: 'stone-golem',
    name: 'Steingolem',
    palette: [0x9c9689, 0x6b675d, 0xd8d2c4],
    elements: [8600, 2600, 7800],
    trait: 'toughHide',
    bonus: 'bulwark',
    archetype: 'tank',
  },
  {
    id: 'mire-hound',
    name: 'Moorhund',
    palette: [0x7a8c5a, 0x51603c, 0xc4d99b],
    elements: [5500, 5200, 2400],
    trait: 'restless',
    bonus: 'swiftness',
    archetype: 'damage',
  },
  {
    id: 'ember-cub',
    name: 'Glutjunges',
    palette: [0xd8823f, 0xa8541f, 0xffd9a0],
    elements: [6100, 5900, 3600],
    trait: 'keenEdge',
    bonus: 'frenzy',
    archetype: 'damage',
  },
  {
    id: 'bone-thrall',
    name: 'Knochenknecht',
    palette: [0xd8d2c0, 0x9c9482, 0xf2ece0],
    elements: [4800, 4400, 5200],
    trait: 'focused',
    bonus: 'endurance',
    archetype: 'damage',
  },
  {
    id: 'hollow-warden',
    name: 'Hohler Hüter',
    palette: [0x6f6a8c, 0x46425e, 0xc4bee0],
    elements: [5200, 3800, 6400],
    trait: 'toughHide',
    bonus: 'endurance',
    archetype: 'tank',
  },
  {
    id: 'marsh-horror',
    name: 'Marschschrecken',
    palette: [0x6a8a72, 0x43594a, 0xb0d0b8],
    elements: [7400, 4600, 5100],
    trait: 'heavyTread',
    bonus: 'bulwark',
    archetype: 'tank',
  },
  {
    id: 'cinder-wisp',
    name: 'Glutfunke',
    palette: [0xe8b45c, 0xb8853a, 0xfff0c4],
    elements: [3400, 7200, 2100],
    trait: 'keenEdge',
    bonus: 'precision',
    archetype: 'ambusher',
  },
  {
    id: 'grave-moth',
    name: 'Grabschmetterling',
    palette: [0xa89cc4, 0x746a90, 0xe0d8f0],
    elements: [3100, 4600, 2800],
    trait: 'deepLungs',
    bonus: 'swiftness',
    archetype: 'swarm',
  },
  {
    id: 'iron-crawler',
    name: 'Eisenkriecher',
    palette: [0x8c98a0, 0x5c666e, 0xd0dae0],
    elements: [6800, 3800, 7200],
    trait: 'toughHide',
    bonus: 'bulwark',
    archetype: 'tank',
  },
]
