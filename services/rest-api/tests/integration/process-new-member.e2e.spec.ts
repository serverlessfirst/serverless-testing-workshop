
import { AWS_REGION } from '@svc/config';
import { deleteClub, putClubMember } from '@svc/lib/repos/clubs-repo';
import {
  Club, ClubVisibility, MemberRole, User, ClubMember, MemberJoinedClubEvent, EventDetailType,
} from '@svc/lib/types/sports-club-manager';
import uuid from '@svc/lib/uuid';
import { generateTestUser } from '@tests/utils/test-data-generator';
import { EventBridgeEvent } from 'aws-lambda';

const createdClubs: Club[] = [];

const getTestClubMember = (userId: string) => {
  const club: Club = {
    id: uuid(),
    name: 'My test club',
    sport: 'Soccer',
    managerId: uuid(),
    visibility: ClubVisibility.PRIVATE,
  };
  createdClubs.push(club);
  const user: User = {
    id: userId,
    ...generateTestUser(userId),
  };
  const member: ClubMember = {
    role: MemberRole.PLAYER,
    club,
    user,
  };
  return member;
};

const E2E_TEST_QUEUE_URL = process.env.E_2_E_TEST_EVENT_BRIDGE_TARGET_QUEUE_URL;

describe('`ddbProcessNewMember` Lambda function', () => {
  afterAll(async () => {
    await Promise.all(createdClubs.map(c => deleteClub(c.id)));
  });

  describe('[e2e]', () => {
    it('is triggered by a DynamoDB write and then publishes correct event to EventBridge', async () => {
      // Arrange
      const member = getTestClubMember(`processNewMemberTest_User1_${uuid()}`);

      // Act: add new ClubMember to DDB
      await putClubMember(member.club, member.user);

      // Assert: check event added to EventBridge by checking e2e SQS queue
      await expect({
        region: AWS_REGION,
        queueUrl: E2E_TEST_QUEUE_URL,
        timeout: 20000,
        pollEvery: 1000,
      }).toHaveMessage((evt: EventBridgeEvent<EventDetailType.MEMBER_JOINED_CLUB, MemberJoinedClubEvent>) =>
        evt['detail-type'] === EventDetailType.MEMBER_JOINED_CLUB && evt.detail.member.user.id === member.user.id);
    });
  });
});
