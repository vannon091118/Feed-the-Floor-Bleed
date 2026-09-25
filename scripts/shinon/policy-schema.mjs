#!/usr/bin/env node
/** Striktes Schema und parsebare Fehlermeldungen für policy.json. */
import { z } from 'zod'

const stringList = z.array(z.string().min(1)).min(1)
const extensionList = z.array(z.string().regex(/^\.[a-z0-9]+$/i)).min(1)
const capSchema = z
  .object({
    prefix: z.string().min(1),
    cap: z.number().int().positive(),
    owner: z.string().min(1),
  })
  .strict()
const domainSchema = z
  .object({
    contracts: z.string().min(1),
    'sim-core': z.string().min(1),
    client: z.string().min(1),
    server: z.string().min(1),
  })
  .strict()
const allowedSchema = z
  .object({
    contracts: stringList,
    'sim-core': stringList,
    client: stringList,
    server: stringList,
  })
  .strict()

export const SUPPORTED_POLICY_VERSION = 1

export const policySchema = z
  .object({
    version: z.number().int().positive(),
    engine: z
      .object({
        always: stringList,
        slices: z.record(
          z
            .object({
              prefixes: stringList.optional(),
              contains: stringList.optional(),
            })
            .strict(),
        ),
      })
      .strict(),
    source: z
      .object({ extensions: extensionList, ignoreDirectories: stringList })
      .strict(),
    globalLoc: z.object({ roots: stringList }).strict(),
    locCaps: z.array(capSchema).min(1),
    deadCode: z.object({ roots: stringList }).strict(),
    coreDeterminism: z.object({ roots: stringList }).strict(),
    falsePositive: z
      .object({ roots: stringList, extensions: extensionList })
      .strict(),
    redundancy: z
      .object({ roots: stringList, window: z.number().int().positive() })
      .strict(),
    contracts: z
      .object({
        root: z.string().min(1),
        package: z.string().min(1),
        zodVersion: z.string().min(1),
      })
      .strict(),
    modularity: z
      .object({ domains: domainSchema, allowed: allowedSchema })
      .strict(),
  })
  .strict()

export function parsePolicy(input) {
  const result = policySchema.safeParse(input)
  if (result.success) {
    if (result.data.version === SUPPORTED_POLICY_VERSION)
      return { ok: true, policy: result.data }
    return {
      ok: false,
      errors: [
        `version: inkompatible Policy-Version ${result.data.version}; unterstützt wird ${SUPPORTED_POLICY_VERSION}`,
      ],
    }
  }
  const errors = result.error.issues.map((issue) => {
    const basePath = issue.path.join('.') || 'policy'
    const unknown = issue.message.match(/Unrecognized key\(s\) in object: (.+)/)
    const field = unknown
      ? `${basePath}.${unknown[1].replaceAll("'", '')}`
      : basePath
    return `${field}: ${issue.message}`
  })
  return { ok: false, errors }
}
