import { defineConfig } from 'vite';
import dts from 'vite-plugin-dts';
import react from '@vitejs/plugin-react-swc';
import path from 'path';

export default defineConfig({
  plugins: [
    react(),
    dts({
      insertTypesEntry: true,
      tsconfigPath: path.resolve(__dirname, 'tsconfig.json'),
      exclude: ['**/__tests__/**', '**/*.test.ts', '**/*.spec.ts'],
    }),
  ],
  build: {
    lib: {
      entry: path.resolve(__dirname, 'src/index.ts'),
      name: 'McpUiGenerator',
      formats: ['es', 'umd'],
      fileName: (format) =>
        `index.${format === 'es' ? 'mjs' : format === 'umd' ? 'js' : format + '.js'}`,
    },
    sourcemap: true,
  },
});
