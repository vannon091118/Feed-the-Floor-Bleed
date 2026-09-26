export type CombatSide = 'heroes' | 'monsters'
export type CombatRole = 'hero' | 'monster' | 'boss'
export type CombatStage = 'heroes-win' | 'monsters-win' | 'timeout'
export type CombatEventType = 'move' | 'attack' | 'death' | 'end'

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
  maxHp: number
  attack: number
  defense: number
  initiative: number
  moveCooldown: number
  attackCooldown: number
  routeIndex: number
}

export interface CombatUnitState extends CombatUnitSpec {
  hp: number
  nextActionTick: number
  alive: boolean
}

export interface CombatEvent {
  tick: number
  type: CombatEventType
  actorId: string
  targetId: string
  amount: number
  fromIndex: number
  toIndex: number
  stage: CombatStage | 'running'
}

export interface CombatTrailEntry {
  x: number
  y: number
  cell: number
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
