export default {
  ignore: ['empty.cjs', 'src/styles/*.css'],
  ignoreDependencies: [
    /^@semantic-release\//,
    /^@emnapi\//,
    'cloudflare',
    '@nestjs/platform-express',
  ],
};
