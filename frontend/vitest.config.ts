import { defineConfig } from 'vitest/config'
import react from '@vitejs/plugin-react'

export default defineConfig({
  plugins: [react()],
  test: {
    globals: true,
    environment: 'jsdom',
    setupFiles: ['./src/__tests__/setup.ts'],
    coverage: {
      provider: 'v8',
      reporter: ['text', 'html', 'lcov'],
      include: [
        'src/pages/LoginPage.tsx',
        'src/pages/RegisterPage.tsx',
        'src/pages/salon/SetupGuide.tsx',
        'src/pages/salon/LohnfaktorTab.tsx',
        'src/__tests__/calcVariants.test.ts',
      ],
      exclude: ['src/__tests__/**'],
      thresholds: {
        lines: 70,
        functions: 70,
        branches: 60,
      },
    },
  },
})
