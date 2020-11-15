const baseConfig = require('./jest.config.unit');

module.exports = {
  ...baseConfig,
  testRegex: '/tests/integration/.+/?.+\\.spec\\.ts',
  setupFilesAfterEnv: [
    './tests/utils/setup/init-e2e-tests.ts',
  ],
};
