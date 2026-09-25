import { fileURLToPath } from 'node:url'
import { defineConfig } from 'vitest/config'

export default defineConfig({
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
