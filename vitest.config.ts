import { defineConfig } from 'vitest/config'
import { resolve } from 'path'

export default defineConfig({
  test: {
    environment: 'node',
    globals: true,
    setupFiles: [],
    coverage: {
      provider: 'v8',
      reporter: ['text', 'json', 'html'],
      include: ['src/main/**/*.ts', 'src/renderer/src/**/*.ts'],
      exclude: [
        'src/main/index.ts',
        'src/main/window.ts',
        'src/main/tray.ts',
        'src/renderer/src/main.tsx',
        'src/renderer/src/env.d.ts'
      ]
    }
  },
  resolve: {
    alias: {
      '@shared': resolve(__dirname, 'src/shared'),
      '@renderer': resolve(__dirname, 'src/renderer/src')
    }
  }
})
