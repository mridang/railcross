import { includeIgnoreFile } from '@eslint/compat';
import { fileURLToPath } from 'node:url';
import mridang from '@mridang/eslint-defaults';

export default [
  includeIgnoreFile(fileURLToPath(new URL('.gitignore', import.meta.url))),
  {
    // public/ holds committed static assets (favicons, fonts) and the generated
    // stylesheet, worker.mjs is the wrangler entry that imports the compiled
    // dist (generated post-build), and worker-env.d.ts is an ambient types
    // file — none are source to lint.
    ignores: ['public/**', 'worker.mjs', 'src/worker-env.d.ts'],
  },
  ...mridang.configs.recommended,
  {
    // cloudflare:workers is a Workers runtime built-in (like node:*) with no
    // file to resolve; whitelist it so import/no-unresolved stays active.
    settings: { 'import/core-modules': ['cloudflare:workers'] },
  },
  {
    // Tailwind drives the stylesheet through at-rules (@tailwind, @apply, …)
    // that the css plugin's validator doesn't recognise; Tailwind owns that
    // syntax, so disable just those checks for CSS.
    files: ['**/*.css'],
    rules: {
      'css/no-invalid-at-rules': 'off',
      'css/no-invalid-properties': 'off',
    },
  },
];
