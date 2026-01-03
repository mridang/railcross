module.exports = {
  entry: ['src/app/**/*.{ts,tsx}', 'src/middleware.ts', 'src/workers/*.ts'],
  project: ['src/**/*.{ts,tsx}'],
  ignore: ['public/js/tailwind.3.4.5.js'],
};
