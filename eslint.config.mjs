import mridangPlugin from '@mridang/eslint-defaults';

export default [
  {
    ignores: ['dist/**', '.wrangler/**', 'coverage/**', '.out/**', 'public/**'],
  },
  ...mridangPlugin.configs.recommended,
];
