import { defineConfig } from 'vitest/config';
import react from '@vitejs/plugin-react';
import path from 'path';

export default defineConfig({
  plugins: [react({
    jsxRuntime: 'classic',
  })],
  resolve: {
    alias: [
      // Fix jsx-runtime resolution for React 16 in all contexts
      {
        find: /^react\/jsx-runtime$/,
        replacement: path.resolve(__dirname, 'node_modules/react/jsx-runtime.js'),
      },
      {
        find: /^react\/jsx-dev-runtime$/,
        replacement: path.resolve(__dirname, 'node_modules/react/jsx-dev-runtime.js'),
      },
    ],
  },
  test: {
    globals: true,
    environment: 'jsdom',
    setupFiles: ['./src/test-setup.ts'],
    deps: {
      external: ['react/jsx-runtime', 'react/jsx-dev-runtime'],
    },
  },
});
