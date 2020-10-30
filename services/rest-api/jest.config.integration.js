const baseConfig = require('./jest.config.unit');

module.exports = {
  ...baseConfig,
  setupFilesAfterEnv: [
    './tests/utils/load-test-config.ts',
  ],
};
