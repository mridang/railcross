/**
 * @file Knip configuration listing the files and dependencies the unused-code check should ignore.
 */
export default {
  ignore: ['empty.cjs', 'src/styles/*.css'],
  ignoreDependencies: [
    /^@semantic-release\//,
    /^@emnapi\//,
    'cloudflare',
    '@nestjs/platform-express',
  ],
};
