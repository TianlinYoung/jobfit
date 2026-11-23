// Build and test configuration: Vite bundles the app, Vitest runs the unit tests.
import { defineConfig } from 'vitest/config';
import react from '@vitejs/plugin-react';

export default defineConfig({
  plugins: [react()],
  test: {
    include: ['tests/**/*.test.ts'],
    coverage: {
      provider: 'v8',
      // Only the business logic has a coverage target; UI is verified by hand in v1.
      include: ['src/core/**/*.ts'],
      thresholds: { lines: 80, functions: 80, branches: 80, statements: 80 },
      reporter: ['text', 'html'],
    },
  },
});
