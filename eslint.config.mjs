import { defineConfig, globalIgnores } from 'eslint/config';
import nextVitals from 'eslint-config-next/core-web-vitals';
import tseslint from 'typescript-eslint';
import playwright from 'eslint-plugin-playwright';
import vitest from '@vitest/eslint-plugin';
import importPlugin from 'eslint-plugin-import';

export default defineConfig([
  globalIgnores([
    '.next/**',
    'out/**',
    'build/**',
    'coverage/**',
    'playwright-report/**',
    'test-results/**',
    '.lighthouseci/**',
    'next-env.d.ts',
    // Kit-owned files (owner answer in ticket 02).
    '.claude/**',
    '.github/**',
    'docs/**',
    'scripts/**',
    'templates/**',
    'e2e/flows/_example-flow.spec.ts',
  ]),
  ...nextVitals,
  ...tseslint.configs.recommendedTypeChecked,
  {
    languageOptions: {
      parserOptions: { projectService: true, tsconfigRootDir: import.meta.dirname },
    },
  },
  {
    files: ['**/*.mjs'],
    ...tseslint.configs.disableTypeChecked,
  },
  {
    ...playwright.configs['flat/recommended'],
    files: ['e2e/**/*.ts', 'playwright.config.ts'],
    rules: {
      ...playwright.configs['flat/recommended'].rules,
      'playwright/no-focused-test': 'error',
      'playwright/no-skipped-test': 'error',
    },
  },
  {
    files: ['**/*.test.{ts,tsx}'],
    plugins: { vitest },
    rules: {
      'vitest/no-focused-tests': 'error',
      'vitest/no-disabled-tests': 'error',
    },
  },
  {
    files: ['**/*.{ts,tsx}'],
    plugins: { import: importPlugin },
    rules: {
      '@typescript-eslint/no-explicit-any': 'error',
      '@typescript-eslint/no-floating-promises': 'error',
      'no-empty': ['error', { allowEmptyCatch: false }],
      'no-console': ['error', { allow: ['warn', 'error'] }],
      'import/no-restricted-paths': [
        'error',
        { zones: [{ target: './src/components', from: './src/server' }] },
      ],
    },
  },
]);
