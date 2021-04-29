const { pathsToModuleNameMapper } = require('ts-jest/utils');
const { compilerOptions } = require('./tsconfig');

const moduleNameMapper = pathsToModuleNameMapper(compilerOptions.paths, { prefix: '<rootDir>/' });

module.exports = {
  testRegex: '/tests/unit/',
  moduleNameMapper,
  roots: ['<rootDir>'],
  transform: {
    '^.+\\.ts$': 'ts-jest',
  },
  testEnvironment: 'node',
  moduleFileExtensions: [
    'ts',
    'tsx',
    'js',
    'jsx',
    'json',
    'node',
  ],
  coveragePathIgnorePatterns: [
    '(tests/.*.mock).(jsx?|tsx?)$',
  ],
  testPathIgnorePatterns: [
    '/node_modules/',
    '<rootDir>/dist',
    '<rootDir>/.build',
    '<rootDir>/.serverless',
  ],
  setupFilesAfterEnv: [
    './tests/utils/setup/init-unit-tests.ts',
  ],
};
