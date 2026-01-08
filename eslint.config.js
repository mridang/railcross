const mridangPlugin = require('@mridang/eslint-defaults');
const nextPlugin = require('@next/eslint-plugin-next');

module.exports = [
  ...mridangPlugin.configs.recommended,
  nextPlugin.configs['core-web-vitals'],
  {
    ignores: [
      'public/**',
      '.next/**',
      '.wrangler/**',
      '.open-next/**',
      'worker/**',
    ],
  },
  {
    files: ['src/**/*.ts', 'src/**/*.tsx'],
    rules: {
      'testing-library/no-debugging-utils': 'off',
    },
  },
  {
    files: ['next-env.d.ts'],
    rules: {
      '@typescript-eslint/triple-slash-reference': 'off',
    },
  },
];
