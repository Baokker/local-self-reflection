import { defineConfig } from 'vitest/config';
import react from '@vitejs/plugin-react';

const basePath = (globalThis as typeof globalThis & {
  process?: { env?: Record<string, string | undefined> };
}).process?.env?.VITE_BASE_PATH;

export default defineConfig({
  base: basePath || '/',
  plugins: [react()],
  test: {
    environment: 'jsdom',
    setupFiles: './src/test/setup.ts',
    globals: true
  }
});
