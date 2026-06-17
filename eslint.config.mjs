import { includeIgnoreFile } from '@eslint/compat';
import { fileURLToPath } from 'node:url';
import mridangPlugin from '@mridang/eslint-defaults';

export default [
  includeIgnoreFile(fileURLToPath(new URL('.gitignore', import.meta.url))),
  {
    ignores: ['public/**'],
  },
  ...mridangPlugin.configs.recommended,
  {
    settings: { 'import/core-modules': ['cloudflare:workers'] },
  },
  {
    files: ['worker.mjs'],
    rules: { 'import/no-unresolved': 'off' },
  },
  {
    files: ['**/*.d.ts'],
    rules: { '@typescript-eslint/triple-slash-reference': 'off' },
  },
];
