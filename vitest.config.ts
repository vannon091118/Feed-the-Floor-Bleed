import { fileURLToPath } from 'node:url'
import { defineConfig } from 'vitest/config'

export default defineConfig({
  test: {
    // `.freebuff/` enthält Arbeitskopien von Feature-Branches. Ohne Ausschluss
    // collectet Vitest deren Tests doppelt und zählt sie in jedem Lauf mit.
    exclude: ['**/node_modules/**', '**/dist/**', '.freebuff/**'],
    // Der Engine-Smoke-Test legt ein echtes Git-Repo an und startet die
    // Engine als Kindprozess. Unter Parallel-Last braucht das über 5 Sekunden,
    // der Vitest-Default wäre hier zu knapp.
    testTimeout: 30_000,
  },
  resolve: {
    alias: {
      '@floor/contracts': fileURLToPath(
        new URL('./packages/contracts/src', import.meta.url),
      ),
      '@floor/sim-core': fileURLToPath(
        new URL('./packages/sim-core/src', import.meta.url),
      ),
    },
  },
})
