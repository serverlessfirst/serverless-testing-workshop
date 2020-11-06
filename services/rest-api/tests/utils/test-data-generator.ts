import { UserProfile } from '@svc/lib/types/sports-club-manager';
import faker from 'faker';

const TEST_EMAIL_ADDRESS_USERNAME = process.env.TEST_EMAIL_ADDRESS_USERNAME || 'paul+testingworkshop';
const TEST_EMAIL_ADDRESS_DOMAIN = process.env.TEST_EMAIL_ADDRESS_DOMAIN || 'example.com';

export const randomEmail = (): string => `${TEST_EMAIL_ADDRESS_USERNAME}_${faker.random.alpha({ count: 16 })}@${TEST_EMAIL_ADDRESS_DOMAIN}`.toLowerCase();

export const randomPassword = (): string => `${faker.random.alphaNumeric(16)}s3rv3rl35515T!`;

export const randomName = () => faker.name.findName();

export const generateTestUser = () => {
  const email = randomEmail();
  return {
    email,
    username: email,
    name: randomName(),
  } as UserProfile;
};
