import { defineConfig } from 'vitest/config'

export default defineConfig({
  resolve: {
    // Map 'process' to Node's built-in so the unused import in morseStringUtils.ts resolves cleanly.
    // The npm 'process' package is a browser shim and doesn't export setMaxListeners.
    alias: {
      process: 'node:process',
    },
  },
  test: {
    // Run in Node.js (no browser/DOM needed — all tested code is pure logic).
    environment: 'node',

    // Makes describe / it / expect available globally without needing to import them.
    globals: true,

    // Only pick up files ending in .test.ts inside src/.
    include: ['src/**/*.test.ts'],

    // Use the test-specific tsconfig that includes vitest/globals types.
    typecheck: { tsconfig: './tsconfig.test.json' },
  },
})
