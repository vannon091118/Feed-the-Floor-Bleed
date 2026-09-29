import { z } from 'zod'
import { DungeonGridSchema } from './grid'
import { versionEnvelope } from './version'

const opaqueIdSchema = z.string().min(1)
const wholeNumberSchema = z.number().int().safe()
/**
 * Ein Verteidiger-Platz im eingefrorenen Stand.
 *
 * `generation` steht seit v6 hier und nicht im Ergebnis. Die Goldformel
 * (`docs/GOLDFORMEL.md`) braucht je gefallenem Gegner eine Stärke und eine
 * Generation; die **Stärke** lässt sich über `monsterId` aus der Registry
 * auflösen, die **Generation** nicht, weil sie nirgends sonst steht. Sie gehört
 * zum eingefrorenen Verteidiger und nicht zur Kampfrechnung — ein Ergebnis, das
 * sie nachzählt, müsste sie erst dorthin kopieren.
 *
 * Sie ist bewusst **kein** Teil von `monsterId`. Die Basisart geht als Salz in
 * den Zucht-Seed ein (`genome/mutation.ts`); läge die Generation im String,
 * verschöbe jede Zucht den Seed und damit den Replay-Hash eines eingefrorenen
 * Runs. Hier steht sie daneben und lässt den Seed unberührt.
 *
 * Fehlt das Feld, gilt Generation 1 — ein Basis-Monster ohne Zucht. Das macht
 * alte Stände lesbar, statt sie zu verwerfen, und ist dieselbe Bedeutung wie
 * `baseGenome`: Generation 1 ist der Ausgangspunkt.
 */
const monsterSlotSchema = z
  .object({
    monsterId: opaqueIdSchema.nullable(),
    generation: wholeNumberSchema.min(1).optional(),
  })
  .strict()
const activeTeamMemberSchema = z
  .object({
    heroId: opaqueIdSchema,
    temporaryFatigue: wholeNumberSchema,
    temporaryInjury: wholeNumberSchema,
  })
  .strict()

/**
 * Die Beute, die noch nicht im Dorfbestand steht.
 *
 * Der Escrow ist der Zwischenstand der Push-Your-Luck-Schleife: Beute einer
 * Etage liegt gesichert hier, bis der Lauf ans Dorf übergeben wird; bei einer
 * Niederlage wird nur der **ungesicherte** Anteil fällig. Er steht optional im
 * eingefrorenen Stand, weil ältere Stände keinen führen — fehlend heißt „noch
 * nichts gesichert" und nicht „unbekannt". Die Zahlen sind `[K]`.
 */
const escrowSchema = z
  .object({ gold: wholeNumberSchema, materials: wholeNumberSchema })
  .strict()

export const raidSnapshotShape = {
  resources: z
    .object({ gold: wholeNumberSchema, materials: wholeNumberSchema })
    .strict(),
  escrow: escrowSchema.optional(),
  monsterSlots: z.array(monsterSlotSchema).length(5),
  activeTeam: z.array(activeTeamMemberSchema).min(1).max(5),
  dungeon: DungeonGridSchema,
}

export const RaidSnapshotSchema = versionEnvelope
  .extend(raidSnapshotShape)
  .strict()
export type RaidSnapshot = z.infer<typeof RaidSnapshotSchema>
