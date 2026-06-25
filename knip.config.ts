export default {
  ignore: ['empty.cjs', 'src/styles/*.css'],
  ignoreDependencies: [
    /^@semantic-release\//,
    'cloudflare',
    '@nestjs/platform-express',
  ],
};
