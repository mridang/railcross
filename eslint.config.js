const mridangPlugin = require('@mridang/eslint-defaults');

module.exports = [
  ...mridangPlugin.configs.recommended,
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
