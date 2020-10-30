/* eslint import/no-extraneous-dependencies:0 */
import dotenv from 'dotenv';
import path from 'path';

process.env.STAGE = process.env.STAGE || 'dev';

// Load local environment-specific config values into process.env for purposes of running integration tests
dotenv.config({
  path: path.resolve(__dirname, `./config/local.${process.env.STAGE}.env`),
});

// Load environment variables generated from serverless.yml
dotenv.config({
  path: path.resolve(__dirname, '../../.env'),
});
