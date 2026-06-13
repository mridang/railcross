export default {
  extensionsToTreatAsEsm: ['.ts', '.tsx'],
  transform: {
    '^.+\\.m?[tj]sx?$': [
      'ts-jest',
      {
        useESM: true,
        tsconfig: 'tsconfig.jest.json',
      },
    ],
  },
  testEnvironment: 'node',
  setupFiles: ['<rootDir>/test/env.ts'],
  testMatch: ['**/*.+(spec|test).[tj]s?(x)'],
  moduleFileExtensions: ['js', 'jsx', 'ts', 'tsx', 'json', 'node'],
  moduleNameMapper: {
    // The Workers-only runtime module is stubbed so imports resolve under Jest.
    '^cloudflare:workers$': '<rootDir>/test/stubs/cloudflare-workers.ts',
    // Under NodeNext, source imports carry a `.js` suffix that ts-jest must map
    // back to the `.ts` source it compiles on the fly.
    '^(\\.{1,2}/.*)\\.js$': '$1',
  },
  testPathIgnorePatterns: ['/node_modules/', '/frontend/', '/dist/'],
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
