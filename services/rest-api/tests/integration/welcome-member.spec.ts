import { AWS_REGION, lambdaConfig } from '@svc/config';
import { LambdaFunctionHandlerInvoker } from '@tests/utils/handler-invokers/lambda-function-handler-invoker';
import { handler } from '@svc/handlers/eventbridge/welcome-member';
import { v4 as uuidv4 } from 'uuid';
import {
  Club, ClubVisibility, EventDetailType, MemberJoinedClubEvent, MemberRole, User,
} from '@svc/lib/types/sports-club-manager';
import { publishEvent } from '@svc/lib/events/events-publisher';
import { getEventBridgeEvent } from '@tests/utils/lambda-payload-generator';

const lambdaFunctionName = `${lambdaConfig.functionNamePrefix}ebWelcomeMember`;

const lambdaInvoker = new LambdaFunctionHandlerInvoker({
  awsRegion: AWS_REGION,
  lambdaFunctionName,
  handler,
});

describe('`welcome-member` Lambda function', () => {
  jest.setTimeout(30000);

  const testManager: User = {
    id: '123456789',
    username: 'notifyMemberJoinedTestManager',
    email: 'notifyMemberJoinedTestManager@example.com',
  };
  const testClub: Club = {
    id: 'notifyMemberJoinedClub1-5078-4f0c-a0a1-d3b7aa6ddae',
    name: 'notifyMemberJoinedClub1',
    sport: 'Soccer',
    visibility: ClubVisibility.PRIVATE,
    managerId: testManager.id,
  };

  it('is triggered whenever MemberJoinedClubEvent is sent to EventBridge [e2e]', async () => {
    const eventDetail: MemberJoinedClubEvent = {
      member: {
        user: {
          id: `welcomeMemberTest1_${uuidv4()}`,
          email: 'clubMember1@example.com',
          username: 'clubMember1@example.com',
        },
        role: MemberRole.PLAYER,
        club: testClub,
      },
    };

    // Act: send event to EB
    await publishEvent(eventDetail, EventDetailType.MEMBER_JOINED_CLUB);

    // Assert: Verify unique member userId is logged to CloudWatch by Lambda (see first line in welcome-member.ts handler)
    const expectedLog = eventDetail.member.user.id;
    await expect({
      region: AWS_REGION,
      function: lambdaFunctionName,
      timeout: 20000,
    }).toHaveLog(expectedLog);
  });

  it('sends correct email message to the OutboundEmails SQS queue [e2e]', async () => {
    // Arrange: Create an EventBridge event payload
    const eventDetail: MemberJoinedClubEvent = {
      member: {
        user: {
          id: 'welcomeMemberTest2',
          email: 'clubMember2@example.com',
          username: 'clubMember2@example.com',
        },
        role: MemberRole.PLAYER,
        club: testClub,
      },
    };
    const ebEvent = getEventBridgeEvent(EventDetailType.MEMBER_JOINED_CLUB, eventDetail);

    // Act: Invoke Lambda remotely
    await lambdaInvoker.invoke(ebEvent);

    // Assert
    // We could inspect the SQS queue here, but that's unreliable as another Lambda may get that message first.
    // So instead, we'll check the CloudWatch logs where we've logged out the unique EventBridge eventId that we generated.
    const expectedLog = `[${ebEvent.id}] Email message queued for member`;
    await expect({
      region: AWS_REGION,
      function: lambdaFunctionName,
      timeout: 20000,
    }).toHaveLog(expectedLog);
  });
});
