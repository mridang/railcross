module.exports = {
  preset: 'ts-jest/presets/js-with-ts',
  transform: {
    '^.+\\.m?[tj]sx?$': [
      'ts-jest',
      {
        tsconfig: 'tsconfig.jest.json',
      },
    ],
  },
  testEnvironment: 'node',
  testMatch: ['**/*.+(spec|test).[tj]s?(x)'],
  moduleFileExtensions: ['js', 'jsx', 'ts', 'tsx', 'json', 'node'],
  moduleNameMapper: {
    '^@/(.*)$': '<rootDir>/src/$1',
  },
  testPathIgnorePatterns: ['/node_modules/', '/dist/', '/.next/'],
  resetModules: false,
  collectCoverage: true,
  coverageDirectory: './.out',
  collectCoverageFrom: ['src/**/*.{js,ts,tsx}', '!src/**/*.d.ts'],
  coverageReporters: ['lcov', 'text'],
  coveragePathIgnorePatterns: ['/dist/', '/.next/'],
  testTimeout: 60000,
  globalSetup: './test/setup.ts',
  globalTeardown: './test/teardown.ts',
  reporters: [
    'default',
    [
      'jest-junit',
      {
        outputDirectory: './.out',
        outputName: 'junit.xml',
      },
    ],
  ],
};
