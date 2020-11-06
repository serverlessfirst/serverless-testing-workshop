
const getEnvString = (key: string, required: boolean = false) => {
  const val = process.env[key];
  if (required && !val) {
    throw new Error(`Missing required environment variable: ${key}`);
  }
  return val!;
};

export const STAGE = getEnvString('STAGE', true);

export const AWS_REGION = getEnvString('REGION', true);

export const ddbConfig = {
  clubsTable: getEnvString('DDB_TABLE_CLUBS'),
  membersTable: getEnvString('DDB_TABLE_MEMBERS'),
};

export const cognitoConfig = {
  userPoolId: getEnvString('COGNITO_USER_POOL_ID'),
  userPoolClientId: getEnvString('COGNITO_USER_POOL_CLIENT_ID'),
};

export const apiGatewayConfig = {
  domainName: getEnvString('API_GW_DOMAIN'),
  getBaseUrl: () => `https://${getEnvString('API_GW_DOMAIN')}.execute-api.${AWS_REGION}.amazonaws.com/`,
};
