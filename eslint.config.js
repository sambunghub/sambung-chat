import js from '@eslint/js';
import ts from 'typescript-eslint';
import svelte from 'eslint-plugin-svelte';
import prettier from 'eslint-config-prettier';

/** @type {import('eslint').Linter.Config[]} */
export default [
  {
    ignores: [
      '**/build/**',
      '**/.svelte-kit/**',
      '**/dist/**',
      '**/node_modules/**',
      '**/*.d.ts',
      '.turbo/**',
    ],
  },
  js.configs.recommended,
  ...ts.configs.recommended,
  ...svelte.configs['flat/recommended'],
  prettier,
  {
    files: ['**/*.svelte'],
    languageOptions: {
      parserOptions: {
        svelteFeatures: {},
      },
    },
    rules: {
      // Disable parsing errors for Svelte 5 syntax that parser doesn't fully support yet
      '@typescript-eslint/no-unused-vars': 'off',
      'svelte/no-navigation-without-resolve': 'off',
    },
  },
  {
    languageOptions: {
      globals: {
        browser: true,
        es2022: true,
        node: true,
        process: 'readonly',
        Buffer: 'readonly',
        console: 'readonly',
        window: 'readonly',
        URL: 'readonly',
        TextEncoder: 'readonly',
        TextDecoder: 'readonly',
      },
    },
    rules: {
      '@typescript-eslint/no-unused-vars': ['warn', { argsIgnorePattern: '^_' }],
      '@typescript-eslint/no-explicit-any': 'warn',
      'svelte/no-at-html-tags': 'warn',
      'svelte/no-navigation-without-resolve': 'off',
      'no-empty': 'off',
      'no-extra-boolean-cast': 'off',
    },
  },
];
