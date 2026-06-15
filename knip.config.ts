export default {
  ignore: ['empty.cjs', 'public/js/*.js'],
  ignoreDependencies: [
    /^@semantic-release\//,
    'cloudflare',
    '@nestjs/platform-express',
  ],
};
