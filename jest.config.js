module.exports = {
  preset: 'ts-jest/presets/js-with-ts',
  transform: {
    '^.+\\.m?[tj]sx?$': ['ts-jest'],
  },
  testEnvironment: 'node',
  testMatch: ['**/*.+(spec|test).[tj]s?(x)'],
  moduleFileExtensions: ['js', 'jsx', 'ts', 'tsx', 'json', 'node'],
  moduleNameMapper: {
    '#(.*)': '<rootDir>/src/$1',
  },
  testPathIgnorePatterns: ['/node_modules/', '/frontend/'],
  resetModules: false,
  collectCoverage: true,
  coverageDirectory: './.out',
  collectCoverageFrom: ['src/**/*.{js,ts,dts}'],
  coverageReporters: ['lcov', 'text'],
  coveragePathIgnorePatterns: ['/dist/'],
  testTimeout: 60000,
  globalSetup: './test/setup.ts',
  globalTeardown: './test/teardown.ts',
};
