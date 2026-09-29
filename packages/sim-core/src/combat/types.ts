import type { HeroClass } from '@floor/contracts'
import type { MonsterBehavior } from '../genome/behavior'

export type { HeroClass, MonsterBehavior }
export type CombatSide = 'heroes' | 'monsters'
export type CombatRole = 'hero' | 'monster' | 'boss'
export type CombatStage =
  | 'heroes-win'
  | 'monsters-win'
  | 'timeout'
  /** Kein Kampfergebnis: der Lauf wurde nach dem Boss-Sieg gesichert. */
  | 'extracted'
export type CombatEventType =
  | 'move'
  | 'attack'
  | 'death'
  | 'ambush'
  | 'ability'
  | 'reveal'
  | 'end'

export interface CombatConfig {
  tickRate: number
  maxTicks: number
  attackRange: number
  damageFloor: number
  variancePermille: number
  varianceSwing: number
}

export interface CombatUnitSpec {
  id: string
  side: CombatSide
  role: CombatRole
  /**
   * Verhaltensprofil aus dem Genom der Art, abgeleitet über den Trait
   * (`genome/behavior.ts`), bei Helden und Boss `none`.
   *
   * Es steht im Log, weil ein Replay nur den Log liest: Die Zielentscheidung
   * müsste sonst aus Zahlen neu erraten werden, und das wäre eine zweite
   * Wahrheit über denselben Zug.
   */
  behavior: MonsterBehavior
  /**
   * Klasse des Helden aus dem Contract-Vokabular (`@floor/contracts`).
   *
   * Monster und klassenlose Helden tragen `none`; bis der Klassen-Slice die
   * Werte liefert, ist das der einzige Wert, den die Engine schreibt. Sie steht
   * aus demselben Grund im Spec wie `behavior`: der Log ist die einzige Quelle,
   * aus der ein Replay einen Zug rekonstruieren kann.
   */
  class: HeroClass
  maxHp: number
  attack: number
  defense: number
  initiative: number
  moveCooldown: number
  attackCooldown: number
  /**
   * Platz auf der Route. Vorwärts und rückwärts geht es in Schritten von eins:
   * die Route ist die Bewegungswahrheit, nicht die freie Fläche. Die Zelle
   * einer Einheit steht deshalb nicht hier, sondern in `trail[routeIndex]` —
   * ein zweites Feld wäre eine zweite Wahrheit über denselben Ort.
   */
  routeIndex: number
  /**
   * Zone, in der die Einheit als Hinterhalt aufgestellt ist, oder `-1`.
   *
   * Der Wert kommt aus der Platzierungsgruppe, in der der Verteidiger steht
   * (`grid/zones.ts`). Er steht im Log, weil das Replay ihn sonst nicht kennt:
   * der erste Angriff einer so aufgestellten Einheit durchdringt Rüstung.
   */
  ambushZoneId: number
}

export interface CombatUnitState extends CombatUnitSpec {
  hp: number
  nextActionTick: number
  alive: boolean
  /** Einmalig: nach dem ersten Angriff ist der Hinterhalt verbraucht. */
  ambushAvailable: boolean
  /** Zone der aktuellen Route-Zelle, aus `trail[routeIndex]`. */
  zoneId: number
}

export interface CombatEvent {
  tick: number
  type: CombatEventType
  actorId: string
  targetId: string
  amount: number
  /** Route-Indizes; bei `move` und bei Angriffen sind es die Orte der Beteiligten. */
  fromIndex: number
  toIndex: number
  stage: CombatStage | 'running'
}

export interface CombatTrailEntry {
  x: number
  y: number
  cell: number
  /**
   * Zone der Zelle, aus `classifyDungeonZones` beim Aufbau des Laufs.
   *
   * Sie steht im Trail und nicht in einem eigenen Log-Feld, weil
   * `replayCombat` ausschließlich den Log verliest: die Zone einer Einheit ist
   * die Zone ihrer aktuellen Route-Zelle, und die muss im Log stehen.
   */
  zoneId: number
}

export interface CombatLog {
  seed: number
  config: CombatConfig
  units: CombatUnitSpec[]
  events: CombatEvent[]
  stage: CombatStage
  ticks: number
  hash: string
  trail: CombatTrailEntry[]
}
