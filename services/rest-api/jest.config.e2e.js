const baseConfig = require('./jest.config.unit');

module.exports = {
  ...baseConfig,
  testTimeout: 120000,
  testRegex: '/tests/integration/.+/?.+\\.spec\\.ts',
  setupFilesAfterEnv: [
    './tests/utils/setup/init-e2e-tests.ts',
  ],
};
