// Integration tests: real HTTP requests to a running backend against a real
// database (quacker_test). Run with `pnpm backend test:int`.
const base = require('./package.json').jest;

/** @type {import('jest').Config} */
module.exports = {
  ...base,
  testRegex: '\\.int-spec\\.ts$',
  globalSetup: '<rootDir>/src/test-utils/int/global-setup.ts',
  globalTeardown: '<rootDir>/src/test-utils/int/global-teardown.ts',
  setupFiles: ['<rootDir>/src/test-utils/int/env.ts'],
  // One database, so test files run one after another.
  maxWorkers: 1,
  testTimeout: 30000,
};
