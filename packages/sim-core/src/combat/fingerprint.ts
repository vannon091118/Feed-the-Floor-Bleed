import {
  hashFinish,
  hashStart,
  hashText,
  hashToHex,
  hashWord,
  hashWords,
} from '../hash'
import type {
  CombatEvent,
  CombatLog,
  CombatTrailEntry,
  CombatUnitSpec,
} from './types'

function trailHash(entry: CombatTrailEntry): number {
  let hash = hashWords(hashStart(), [entry.x, entry.y, entry.cell])
  return hash
}

function specHash(spec: CombatUnitSpec): number {
  let hash = hashText(hashStart(), spec.id)
  hash = hashText(hash, spec.side)
  hash = hashText(hash, spec.role)
  hash = hashWords(hash, [
    spec.maxHp,
    spec.attack,
    spec.defense,
    spec.initiative,
    spec.moveCooldown,
    spec.attackCooldown,
    spec.routeIndex,
  ])
  return hash
}

function eventHash(event: CombatEvent): number {
  let hash = hashText(hashStart(), event.type)
  hash = hashWords(hash, [
    event.tick,
    event.amount,
    event.fromIndex,
    event.toIndex,
  ])
  hash = hashText(hash, event.actorId)
  hash = hashText(hash, event.targetId)
  return hashText(hash, event.stage)
}

export function fingerprintCombatLog(log: CombatLog): string {
  let hash = hashWords(hashStart(), [
    log.seed,
    log.config.tickRate,
    log.config.maxTicks,
    log.config.attackRange,
    log.config.damageFloor,
    log.config.variancePermille,
    log.config.varianceSwing,
  ])
  for (const entry of log.trail) hash = hashWord(hash, trailHash(entry))
  for (const unit of log.units) hash = hashWord(hash, specHash(unit))
  for (const event of log.events) hash = hashWord(hash, eventHash(event))
  hash = hashText(hash, log.stage)
  hash = hashWord(hash, log.ticks)
  return hashToHex(hashFinish(hash))
}
