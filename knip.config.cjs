module.exports = {
  entry: ['worker.mjs'],
  // empty.cjs is wired into the bundle through wrangler.toml's [alias] block and
  // public/js/tailwind.3.4.5.js is a vendored browser asset — knip parses
  // neither, so it cannot see that they are used.
  ignore: ['empty.cjs', 'public/js/tailwind.3.4.5.js'],
  // The e2e test imports the NestExpressApplication type only; the deployed
  // worker is Express-free, so @nestjs/platform-express stays undeclared.
  ignoreDependencies: ['@nestjs/platform-express'],
};
