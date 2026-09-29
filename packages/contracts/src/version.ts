import { z } from 'zod'

export const sim_version = '0.0.7' as const
export const CONTRACT_VERSION = 8 as const
export type ContractVersion = typeof CONTRACT_VERSION

export const contractVersionSchema = z.literal(CONTRACT_VERSION)
export const simVersionSchema = z.literal(sim_version)
export const versionEnvelope = z
  .object({
    contractVersion: contractVersionSchema,
    simVersion: simVersionSchema,
  })
  .strict()
