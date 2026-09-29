import { z } from 'zod'

/**
 * Zellarten des Rasters als Zahlen.
 *
 * Die Nummern stehen im Wire-Format: im serialisierten Grid und im gehashten
 * Trail. Deshalb zählt `CellTypeSchema` sie als Literale auf und nennt sie
 * zusätzlich beim Namen — `packages/contracts` darf `sim-core` nicht
 * importieren, und ein Leser dieses Pakets soll trotzdem sehen, was `2` heißt.
 */
export const EMPTY_CELL = 0
export const WALL_CELL = 1
/**
 * Platzierungsmarkierung: markiert den Bereich, in dem eine Gruppe steht.
 * Sie macht keinen Schaden und kostet keine Bewegungspunkte; für den Angreifer
 * ist sie unsichtbar (`toPublicView` maskiert sie zu Boden).
 */
export const PLACEMENT_CELL = 2
export const SPAWN_CELL = 3
export const BOSS_CELL = 4

export const CellTypeSchema = z.union([
  z.literal(EMPTY_CELL),
  z.literal(WALL_CELL),
  z.literal(PLACEMENT_CELL),
  z.literal(SPAWN_CELL),
  z.literal(BOSS_CELL),
])
export type CellTypeValue = z.infer<typeof CellTypeSchema>
