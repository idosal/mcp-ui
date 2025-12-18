import js from '@eslint/js';
import tseslint from 'typescript-eslint';
import react from 'eslint-plugin-react';
import prettier from 'eslint-config-prettier';
import globals from 'globals';

export default tseslint.config(
  // Global ignores (replaces .eslintignore)
  {
    ignores: [
      '**/node_modules/**',
      '**/dist/**',
      '**/coverage/**',
      '**/*.log',
      '**/*.js',
      '**/*.mjs',
      '**/*.cjs',
      'sdks/typescript/client/src/remote-dom/iframe-bundle.ts',
      'examples/**',
      'docs/**',
    ],
  },

  // Base configs
  js.configs.recommended,
  ...tseslint.configs.recommended,

  // React config
  {
    files: ['**/*.tsx', '**/*.jsx'],
    ...react.configs.flat.recommended,
    ...react.configs.flat['jsx-runtime'],
    settings: {
      react: {
        version: 'detect',
      },
    },
  },

  // TypeScript and general config
  {
    files: ['**/*.ts', '**/*.tsx'],
    languageOptions: {
      ecmaVersion: 'latest',
      sourceType: 'module',
      globals: {
        ...globals.node,
        ...globals.browser,
        ...globals.es2021,
        ...globals.jest,
      },
      parserOptions: {
        ecmaFeatures: {
          jsx: true,
        },
      },
    },
    rules: {
      'react/prop-types': 'off',
      '@typescript-eslint/no-unused-vars': [
        'error',
        {
          argsIgnorePattern: '^_',
          varsIgnorePattern: '^_',
          caughtErrorsIgnorePattern: '^_',
        },
      ],
    },
  },

  // Prettier must be last to override other formatting rules
  prettier
);
