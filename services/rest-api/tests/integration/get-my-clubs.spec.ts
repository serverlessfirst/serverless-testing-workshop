import { get as handler } from '@svc/handlers/http/me/clubs';
import { Club, ClubVisibility } from '@svc/lib/types/sports-club-manager';
import _ from 'lodash';
import { putClub, deleteClub } from '@svc/lib/repos/clubs-repo';
import { ApiGatewayHandlerInvoker } from '@tests/utils/handler-invokers/api-gateway-handler-invoker';
import { apiGatewayConfig, AWS_REGION, cognitoConfig } from '@svc/config';
import { AuthenticatedUser, TestUserManager } from '@tests/utils/test-user-manager';

const apiInvoker = new ApiGatewayHandlerInvoker({
  baseUrl: apiGatewayConfig.getBaseUrl(),
  handler,
});

const userManager = new TestUserManager({
  cognitoUserPoolId: cognitoConfig.userPoolId,
  cognitoUserPoolClientId: cognitoConfig.userPoolClientId,
  region: AWS_REGION,
  usernamePrefix: 'getMyClubs',
});

describe('`GET /me/clubs`', () => {
  let user1Context: AuthenticatedUser;
  const createdClubs: Club[] = [];

  const deleteTestClubs = async () => {
    await Promise.all(createdClubs.map((async c => deleteClub(c.id))));
    createdClubs.length = 0;
  };

  beforeAll(async () => {
    // Create test user for use across multiple test cases
    user1Context = await userManager.createAndSignInUser();
  });

  const createClubsForManager = async (managerId: string, clubIdPrefix: string, n = 3) => {
    const clubs = _.times(n, i => ({
      // Use a fixed ID instead of generating UUID to ensure data cleanup is more reliable
      id: `${clubIdPrefix}_getMyClubsTestClub${i}`,
      name: `${clubIdPrefix}-${i}`,
      sport: 'Soccer',
      visibility: ClubVisibility.PRIVATE,
      managerId,
    } as Club));
    return Promise.all(clubs.map(async (c) => {
      await putClub(c);
      createdClubs.push(c);
      return c;
    }));
  };

  it('only returns current users clubs', async () => {
    // Arrange: create 3 clubs for 2 users: the user being tested and another one
    const [user1Clubs] = await Promise.all([
      createClubsForManager(user1Context.user.id, 'u1'),
      createClubsForManager('anotherUserInSystem', 'an'),
    ]);

    // Act: invoke for user1
    const response = await apiInvoker.invoke({
      event: {
        pathTemplate: '/me/clubs',
        httpMethod: 'GET',
      },
      userContext: user1Context,
    });

    // Assert that only user1's clubs come back
    expect(response.statusCode).toEqual(200);
    const results = response.body as Club[];
    expect(results.length).toEqual(user1Clubs.length);
    results.forEach((c: Club) => {
      expect(c.managerId).toEqual(user1Context.user.id);
    });
  });

  it('returns empty list whenever user has no clubs', async () => {
    // Arrange - create new user with no clubs
    const userContext = await userManager.createAndSignInUser();

    // Act: invoke for newUser
    const response = await apiInvoker.invoke({
      event: {
        pathTemplate: '/me/clubs',
        httpMethod: 'GET',
      },
      userContext,
    });

    // Assert that no clubs come back
    expect(response.statusCode).toEqual(200);
    expect(response.body.length).toEqual(0);
  });

  it('returns 401 Unauthorized error if no auth token provided [e2e]', async () => {
    const response = await apiInvoker.invoke({
      event: {
        pathTemplate: '/me/clubs',
        httpMethod: 'GET',
      },
    });
    expect(response.statusCode).toEqual(401);
  });

  afterAll(async () => {
    await Promise.all([
      deleteTestClubs(),
      userManager.dispose(),
    ]);
  });
});
