import mridangPlugin from '@mridang/eslint-defaults';

export default [
  {
    ignores: [
      'dist/**',
      '.wrangler/**',
      'coverage/**',
      '.out/**',
      'public/**',
      // The worker entry imports the compiled `dist/`, absent at lint time, and
      // the ambient types file uses a triple-slash reference for Workers types.
      'worker.mjs',
      'src/worker-env.d.ts',
    ],
  },
  ...mridangPlugin.configs.recommended,
  {
    // `cloudflare:workers` is a virtual runtime module the resolver cannot see;
    // treat it as a core module so import/no-unresolved leaves it alone.
    settings: { 'import/core-modules': ['cloudflare:workers'] },
  },
];
