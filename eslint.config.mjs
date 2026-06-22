import { includeIgnoreFile } from '@eslint/compat';
import { fileURLToPath } from 'node:url';
import mridang from '@mridang/eslint-defaults';

export default [
  includeIgnoreFile(fileURLToPath(new URL('.gitignore', import.meta.url))),
  {
    // public/ holds committed vendored/static assets (e.g. the Tailwind
    // runtime), worker.mjs is the wrangler entry that imports the compiled
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
];
