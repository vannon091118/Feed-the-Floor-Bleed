#!/usr/bin/env node
import { spawnSync } from 'node:child_process'

const res = spawnSync('node', ['scripts/check-hygiene.mjs'], {
  encoding: 'utf8',
  timeout: 30_000,
})
if (res.stdout) process.stdout.write(res.stdout)
if (res.stderr) process.stderr.write(res.stderr)
process.exit(res.status ?? 1)
