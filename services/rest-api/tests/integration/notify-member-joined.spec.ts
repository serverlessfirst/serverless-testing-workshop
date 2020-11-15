import { AWS_REGION, lambdaConfig, sqsConfig } from '@svc/config';
import { publishEvent } from '@svc/lib/events/events-publisher';
import { handler } from '@svc/handlers/eventbridge/notify-member-joined';
import {
  Club,
  ClubVisibility, EventDetailType, MemberJoinedClubEvent, MemberRole, User,
} from '@svc/lib/types/sports-club-manager';
import { LambdaFunctionHandlerInvoker } from '@tests/utils/handler-invokers/lambda-function-handler-invoker';
import { v4 as uuidv4 } from 'uuid';
import { SendEmailRequest } from '@svc/lib/email/types';
import { deleteClub, putClubWithManager } from '@svc/lib/repos/clubs-repo';

const lambdaFunctionName = `${lambdaConfig.functionNamePrefix}ebNotifyMemberJoined`;
const lambdaInvoker = new LambdaFunctionHandlerInvoker({
  awsRegion: AWS_REGION,
  lambdaFunctionName,
  handler,
});

describe('notifyMemberJoined', () => {
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

  beforeAll(async () => {
    await putClubWithManager(testClub, testManager);
  });

  afterAll(async () => {
    await deleteClub(testClub.id);
  });

  it('is triggered whenever MemberJoinedClubEvent is sent to EventBridge [e2e] [slow]', async () => {
    // Arrange: create event matching rule that will cause triggering of Lambda function
    const evt: MemberJoinedClubEvent = {
      member: {
        user: {
          id: `notifyMemberJoinedTest1_${uuidv4()}`, // ensure this data is uniquely identifiable to each test run
          email: 'clubMember1@example.com',
          username: 'clubMember1@example.com',
        },
        role: MemberRole.PLAYER,
        club: testClub,
      },
    };

    // Act: send event to EB
    await publishEvent(evt, EventDetailType.MEMBER_JOINED_CLUB);

    // Assert: Use the aws-testing-library Jest extension to check the EB eventId is present in the CloudWatch logs for the Lambda function
    // https://github.com/erezrokah/aws-testing-library/blob/master/src/jest/README.md#tohavelog
    // remember to use `await` with this `expect`
    const expectedLog = evt.member.user.id;
    await expect({
      region: AWS_REGION,
      function: `${lambdaConfig.functionNamePrefix}ebNotifyMemberJoined`,
      timeout: 20000, // needs a high timeout to account for 1) potential cold start and 2) latency in shipping logs from Lambda to CloudWatch
    }).toHaveLog(expectedLog);
  });

  it('sends correct email message to the OutboundEmails SQS queue when manager exists', async () => {
    const userId = `notifyMemberJoinedTest2_${uuidv4()}`;
    const evt: MemberJoinedClubEvent = {
      member: {
        user: {
          id: userId,
          email: `clubMember_${userId}@example.com`,
          username: `clubMember_${userId}@example.com`,
        },
        role: MemberRole.PLAYER,
        club: testClub,
      },
    };
    await lambdaInvoker.invoke({
      id: uuidv4(),
      account: '',
      region: '',
      time: '',
      resources: [],
      version: '',
      source: '',
      detail: evt,
      'detail-type': EventDetailType.MEMBER_JOINED_CLUB,
    });

    await expect({
      region: AWS_REGION,
      queueUrl: sqsConfig.outboundEmailsQueueUrl,
      timeout: 10000,
    }).toHaveMessage(
      (received: SendEmailRequest) => received.destination?.ToAddresses![0] === testManager.email,
    );
  });
});
