import { post as handler } from '@svc/handlers/http/clubs/club-id/join';
import {
  Club, ClubVisibility, EventDetailType, MemberJoinedClubEvent,
} from '@svc/lib/types/sports-club-manager';
import { v4 as uuidv4 } from 'uuid';
import { putClub, deleteClub, getClubMember } from '@svc/lib/repos/clubs-repo';
import { ApiGatewayHandlerInvoker } from '@tests/utils/handler-invokers/api-gateway-handler-invoker';
import { apiGatewayConfig, AWS_REGION, cognitoConfig } from '@svc/config';
import { AuthenticatedUser, TestUserManager } from '@tests/utils/test-user-manager';
import { EventBridgeEvent } from 'aws-lambda';

const TEST_QUEUE_URL = process.env.E_2_E_TEST_EVENT_BRIDGE_TARGET_QUEUE_URL;

const apiInvoker = new ApiGatewayHandlerInvoker({
  baseUrl: apiGatewayConfig.getBaseUrl(),
  handler,
});

const userManager = new TestUserManager({
  cognitoUserPoolId: cognitoConfig.userPoolId,
  cognitoUserPoolClientId: cognitoConfig.userPoolClientId,
  region: AWS_REGION,
  usernamePrefix: 'joinClub',
});

describe('`POST /clubs/{clubId}/join`', () => {
  let player1Context: AuthenticatedUser;
  const createdClubs: Club[] = [];

  const deleteTestClubs = async () => {
    await Promise.all(createdClubs.map((async c => deleteClub(c.id))));
    createdClubs.length = 0;
  };

  const createTestClub = async (prefix: string) => {
    const club: Club = {
      id: `id-${prefix}-joinclubtestclub`,
      name: `name-${prefix}-joinclubtestclub`,
      sport: 'Soccer',
      visibility: ClubVisibility.PUBLIC,
      managerId: uuidv4(),
    };
    await putClub(club);
    createdClubs.push(club);
    return club;
  };

  beforeAll(async () => {
    player1Context = await userManager.createAndSignInUser();
  });

  it('creates a new ClubMember in DDB whenever required fields are provided', async () => {
    const testClub = await createTestClub('c1');

    const response = await apiInvoker.invoke({
      event: {
        pathTemplate: '/clubs/{clubId}/join',
        httpMethod: 'POST',
        pathParameters: { clubId: testClub.id },
        body: {},
      },
      userContext: player1Context,
    });
    expect(response.statusCode).toEqual(201);

    const savedMember = await getClubMember(testClub.id, player1Context.user.id);
    expect(savedMember).toBeTruthy();
    expect(savedMember!.club).toEqual(testClub);
    expect(savedMember!.user).toEqual(player1Context.user);
  });

  it('publishes a MEMBER_JOINED_CLUB event to EventBridge upon successful completion', async () => {
    const testClub = await createTestClub('c2');
    const response = await apiInvoker.invoke({
      event: {
        pathTemplate: '/clubs/{clubId}/join',
        httpMethod: 'POST',
        pathParameters: { clubId: testClub.id },
        body: {},
      },
      userContext: player1Context,
    });
    expect(response.statusCode).toEqual(201);
    await expect({
      region: AWS_REGION,
      queueUrl: TEST_QUEUE_URL,
      timeout: 10000,
    }).toHaveMessage(
      (msg: EventBridgeEvent<EventDetailType.MEMBER_JOINED_CLUB, MemberJoinedClubEvent>) =>
        msg.detail.member.user.id === player1Context.user.id && msg.detail.member.club.id === testClub.id,
    );
  });

  it('returns 401 Unauthorized error if no auth token provided [e2e]', async () => {
    const response = await apiInvoker.invoke({
      event: {
        pathTemplate: '/clubs/{clubId}/join',
        httpMethod: 'POST',
        pathParameters: { clubId: 'anything' },
        body: {},
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
