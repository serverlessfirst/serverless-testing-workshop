import { AWS_REGION } from '@svc/config';
import { deleteClub, putClubMember } from '@svc/lib/repos/clubs-repo';
import {
  Club, ClubVisibility, MemberRole, ClubMember, MemberJoinedClubEvent, EventDetailType,
} from '@svc/lib/types/sports-club-manager';
import uuid from '@svc/lib/uuid';
import { generateTestUser } from '@tests/utils/test-data-generator';
import { EventBridgeEvent } from 'aws-lambda';

const createdClubs: Club[] = [];

const getTestClubMember = (userId: string): ClubMember => {
  const club: Club = {
    id: uuid(),
    name: 'My test club',
    sport: 'Soccer',
    managerId: uuid(),
    visibility: ClubVisibility.PRIVATE,
  };
  createdClubs.push(club);
  return {
    role: MemberRole.PLAYER,
    club,
    user: {
      id: userId,
      ...generateTestUser(userId),
    },
  };
};
const { E_2_E_TEST_EVENT_BRIDGE_TARGET_QUEUE_URL } = process.env;

describe('`ddbProcessNewMember` Lambda function', () => {
  it('is triggered by a DynamoDB write and then publishes correct event to EventBridge [e2e]', async () => {
    // Arrange
    const member = getTestClubMember(`processNewMemberTest_User1_${uuid()}`);

    // Act: add new ClubMember to DDB
    await putClubMember(member.club, member.user);

    // Assert: check event added to EventBridge by checking e2e SQS queue
    await expect({
      region: AWS_REGION,
      queueUrl: E_2_E_TEST_EVENT_BRIDGE_TARGET_QUEUE_URL,
      timeout: 20000,
      pollEvery: 1000,
    }).toHaveMessage((evt: EventBridgeEvent<EventDetailType.MEMBER_JOINED_CLUB, MemberJoinedClubEvent>) =>
      evt['detail-type'] === EventDetailType.MEMBER_JOINED_CLUB && evt.detail.member.user.id === member.user.id);
  });

  afterAll(async () => {
    await Promise.all(createdClubs.map(c => deleteClub(c.id)));
  });
});
