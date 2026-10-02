#!/usr/bin/env node
import { spawnSync } from 'node:child_process'

const res = spawnSync('node', ['scripts/check-reachability.mjs'], {
  encoding: 'utf8',
  timeout: 60_000,
})
if (res.stdout) process.stdout.write(res.stdout)
if (res.stderr) process.stderr.write(res.stderr)
process.exit(res.status ?? 1)
