const baseConfig = require('./jest.config.unit');

module.exports = {
  ...baseConfig,
  testRegex: '/tests/integration/.+/?.+\\.integration\\.spec\\.ts',
  setupFilesAfterEnv: [
    './tests/utils/load-test-config.ts',
  ],
};
