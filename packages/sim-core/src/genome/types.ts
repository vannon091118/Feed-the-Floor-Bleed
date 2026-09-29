/**
 * Genome — der Besitzer von Zucht, Stats und Gen-Seed.
 *
 * Das Genom ist ein reiner Datenwert: Es kennt keine Kämpfe, keine Zeit und
 * keinen äußeren Zufall. `combat` liest die abgeleiteten Werte, es rechnet sie
 * nicht selbst und kennt die Trait- und Bonuslogik nicht.
 *
 * Die drei Elemente sind das vererbbare Zahlensubstrat. Sie liegen in Permille
 * (`1000` = 1,00 bis `10000` = 10,00), damit Rekombination und Mutation
 * ganzzahlig und damit bitgenau bleiben.
 */

/** Ein Basis-Monster aus der Registry. Unveränderlich. */
export interface BaseMonster {
  readonly id: string
  readonly name: string
  /** Palette des Sprites; vom Genom unabhängig, reine Präsentation. */
  readonly palette: readonly [number, number, number]
  /** Die drei vererbbaren Elemente in Permille, je 1000..10000. */
  readonly elements: readonly [number, number, number]
  readonly trait: TraitId
  readonly bonus: BonusId
  /**
   * Die Kampfrolle der Art, aus der die Taktik sie liest.
   *
   * Sie ist eine feste Eigenschaft der **Basis-Art** und wandert darum nicht
   * in `Genome`: `genome` besitzt Zucht, Stats und Gen-Seed, und eine Zucht
   * aus einem Schattenläufer bleibt ein Schattenläufer. Wer sie liest, holt
   * `baseMonster(genome.baseId).archetype`; ein zweites Feld im Genom wäre eine
   * zweite Wahrheit über dieselbe Sache und würde in jeden eingefrorenen
   * Contract-Stand wandern.
   */
  readonly archetype: ArchetypeId
}

/**
 * Das vererbte Genom eines konkreten Monsters.
 *
 * `elements` ist der einzige Ort, an dem nach der Mutation Zahlen stehen;
 * `stats` ist daraus abgeleitet und wird nicht gespeichert, sondern bei Bedarf
 * neu berechnet. So kann die Ableitungsregel wachsen, ohne dass alte Genome
 * eine eingefrorene Kopie tragen.
 */
export interface Genome {
  readonly baseId: string
  /** 1 = Basis-Monster, jede Zucht erhöht um 1. */
  readonly generation: number
  readonly elements: readonly [number, number, number]
  readonly traits: readonly TraitId[]
  readonly bonuses: readonly BonusId[]
}

/** Die Kampfwerte, die das Genom erzeugt. Alle Werte sind Fixed-Point. */
export interface MonsterStats {
  readonly maxHp: number
  readonly attack: number
  readonly defense: number
  readonly initiative: number
  readonly moveCooldown: number
  readonly attackCooldown: number
}

export const TRAIT_IDS = [
  'toughHide',
  'keenEdge',
  'deepLungs',
  'heavyTread',
  'restless',
  'focused',
] as const
export type TraitId = (typeof TRAIT_IDS)[number]

export const BONUS_IDS = [
  'bulwark',
  'frenzy',
  'endurance',
  'swiftness',
  'precision',
  'vitality',
] as const
export type BonusId = (typeof BONUS_IDS)[number]

/**
 * Die sechs Kampfrollen des Pools.
 *
 * Der Trait sagt, **wie** ein Wesen kämpft, und ist vererblich und veränderlich.
 * Die Rolle sagt, **wofür** es im Kampf da ist, und ist an die Basis-Art
 * gebunden. Genau diese Trennung ist der Grund, warum beides getrennte Felder
 * sind und nicht eines: ein gezüchteter Steingolem behält `tank`, aber nicht
 * zwingend `toughHide`.
 *
 * Die Rollen selbst rechnen nichts — sie sind der Schlüssel, an dem Taktik und
 * die Balance-Messung hängen. Welche Rolle wie stark wiegt, ist `[K]`; die
 * Kampfbalance ist laut `docs/VISUAL_GRUNDSATZ.md` offen.
 */
export const ARCHETYPE_IDS = [
  'tank',
  'damage',
  'support',
  'ambusher',
  'controller',
  'swarm',
] as const
export type ArchetypeId = (typeof ARCHETYPE_IDS)[number]

/** Elementgrenzen. Beide Werte sind Permille, also 1,00 und 10,00. */
export const ELEMENT_MIN = 1000
export const ELEMENT_MAX = 10000
