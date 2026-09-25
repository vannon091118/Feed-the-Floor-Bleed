import { fileURLToPath } from 'node:url'
import preact from '@preact/preset-vite'
import { defineConfig } from 'vite'

export default defineConfig({
  plugins: [preact()],
  resolve: {
    alias: {
      '@floor/contracts': fileURLToPath(
        new URL('../contracts/src', import.meta.url),
      ),
      '@floor/sim-core': fileURLToPath(
        new URL('../sim-core/src', import.meta.url),
      ),
    },
  },
})
