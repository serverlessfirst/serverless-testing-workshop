
const getEnvString = (key: string, required: boolean = false) => {
  const val = process.env[key];
  if (required && !val) {
    throw new Error(`Missing required environment variable: ${key}`);
  }
  return val!;
};

export const APP_NAME = 'TestingWorkshop';

export const STAGE = getEnvString('STAGE', true);

export const AWS_REGION = getEnvString('REGION', true);

export const ddbConfig = {
  clubsTable: getEnvString('DDB_TABLE_CLUBS'),
  membersTable: getEnvString('DDB_TABLE_MEMBERS'),
};

export const eventBridgeConfig = {
  serviceBusName: getEnvString('EVENTBRIDGE_SERVICE_BUS_NAME'),
  defaultSource: 'rest-api',
};

export const cognitoConfig = {
  userPoolId: getEnvString('COGNITO_USER_POOL_ID'),
  userPoolClientId: getEnvString('COGNITO_USER_POOL_CLIENT_ID'),
};

export const apiGatewayConfig = {
  domainName: getEnvString('API_GW_DOMAIN'),
  getBaseUrl: () => `https://${getEnvString('API_GW_DOMAIN')}.execute-api.${AWS_REGION}.amazonaws.com/`,
};

export const lambdaConfig = {
  functionNamePrefix: `${APP_NAME}-restapi-${STAGE}-`,
};

export const sqsConfig = {
  outboundEmailsQueueUrl: getEnvString('OUTBOUND_EMAILS_QUEUE_URL'),
  outboundEmailsDlqUrl: getEnvString('OUTBOUND_EMAILS_DLQ_URL'),
};

export const emailConfig = {
  defaultFromEmailAddress: getEnvString('DEFAULT_FROM_EMAIL'),
};

export const s3Config = {
  mediaBucket: getEnvString('S3_MEDIA_BUCKET'),
  profilePhotosBucketPrefix: getEnvString('S3_MEDIA_BUCKET_CLUB_PROFILES_PREFIX'),
};
