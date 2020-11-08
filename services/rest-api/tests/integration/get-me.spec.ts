import { get as handler } from '@svc/handlers/http/me';
import { User } from '@svc/lib/types/sports-club-manager';
import { apiGatewayConfig, AWS_REGION, cognitoConfig } from '@svc/config';
import { ApiGatewayHandlerInvoker } from '@tests/utils/handler-invokers/api-gateway-handler-invoker';
import { TestUserManager } from '@tests/utils/test-user-manager';

const apiInvoker = new ApiGatewayHandlerInvoker({
  baseUrl: apiGatewayConfig.getBaseUrl(),
  handler,
});

const userManager = new TestUserManager({
  cognitoUserPoolId: cognitoConfig.userPoolId,
  cognitoUserPoolClientId: cognitoConfig.userPoolClientId,
  region: AWS_REGION,
});

describe('`GET /me`', () => {
  it('returns user profile fields for logged in users', async () => {
    const userContext = await userManager.createAndSignInUser();

    const response = await apiInvoker.invoke({
      event: {
        pathTemplate: '/me',
        httpMethod: 'GET',
      },
      userContext,
    });

    expect(response.statusCode).toEqual(200);
    const userProfile = response.body as User;
    expect(userProfile.id).toEqual(userContext.user.id);
    expect(userProfile.email).toEqual(userContext.user.email);
    expect(userProfile.name).toEqual(userContext.user.name);
  });

  // Notice [e2e] to instruct Jest runner to only run this when running E2E tests.
  // That's because the behaviour being tested here is based on APIGW config, not handler code.
  it('returns 401 Unauthorized error if no auth token provided [e2e]', async () => {
    const response = await apiInvoker.invoke({
      event: {
        pathTemplate: '/me',
        httpMethod: 'GET',
      },
    });
    expect(response.statusCode).toEqual(401);
  });

  afterAll(async () => {
    await userManager.dispose();
  });
});
