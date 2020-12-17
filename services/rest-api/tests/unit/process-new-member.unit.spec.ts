// Mock out Eventbridge
import { putEvents as mockedEventBridgePutEvents } from '@tests/utils/aws-mocks/eventbridge-mocked';
import uuid from '@svc/lib/uuid';
import { DDBStreamEventItem, DynamoDBStreamEventName, getDynamoDBStreamEvent } from '@tests/utils/lambda-payload-generator';
import {
  Club, ClubVisibility, MemberJoinedClubEvent, MemberRole, User,
} from '@svc/lib/types/sports-club-manager';
import type { PutEventsRequest } from '@aws-sdk/client-eventbridge';
import { generateTestUser } from '@tests/utils/test-data-generator';
import { ClubMemberDDBItem } from '@svc/lib/repos/clubs-repo';
import _ from 'lodash';

// Must import handler after eventbridge-mocked lib
import { handler } from '@svc/handlers/ddb/process-new-member';

const getTestClubMemberRecord = (userId: string, eventName: DynamoDBStreamEventName) => {
  const club: Club = {
    id: uuid(),
    name: 'My test club',
    sport: 'Soccer',
    managerId: uuid(),
    visibility: ClubVisibility.PRIVATE,
  };
  const user: User = {
    id: userId,
    ...generateTestUser(userId),
  };
  const newMember: ClubMemberDDBItem = {
    role: MemberRole.PLAYER,
    club,
    clubId: club.id,
    user,
    userId: user.id,
  };
  const record: DDBStreamEventItem = {
    keys: { ..._.pick(newMember, ['clubId', 'userId']) },
    newItem: newMember,
    eventName,
  };
  return record;
};

describe('`ddbProcessNewMember` handler', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('returns without error when EventBridge API succeeds', async () => {
    const event = getDynamoDBStreamEvent([
      getTestClubMemberRecord(`${uuid()}_ddbProcessNewMember_User1`, 'INSERT'),
      getTestClubMemberRecord(`${uuid()}_ddbProcessNewMember_User2`, 'INSERT'),
    ]);
    const putEvents = mockedEventBridgePutEvents.mockImplementationOnce(
      () => Promise.resolve({ FailedEntryCount: 0, Entries: [] }),
    );

    await handler(event);

    expect(putEvents).toHaveBeenCalledTimes(1);
    const requestArg = putEvents.mock.calls[0][0] as PutEventsRequest;
    expect(requestArg.Entries).toHaveLength(2);
  });

  it('throws error if EventBridge API rejects with an error', async () => {
    const event = getDynamoDBStreamEvent([
      getTestClubMemberRecord(`${uuid()}_ddbProcessNewMember_User1`, 'INSERT'),
      getTestClubMemberRecord(`${uuid()}_ddbProcessNewMember_User2`, 'INSERT'),
    ]);
    const putEvents = mockedEventBridgePutEvents.mockImplementationOnce(
      () => Promise.reject(new Error('Some network or IAM error')),
    );

    await expect(handler(event)).rejects.toThrowError();

    expect(putEvents).toHaveBeenCalledTimes(1);
  });

  it('throws error if EventBridge API reports a failed entry', async () => {
    const event = getDynamoDBStreamEvent([
      getTestClubMemberRecord(`${uuid()}_ddbProcessNewMember_User1`, 'INSERT'),
      getTestClubMemberRecord(`${uuid()}_ddbProcessNewMember_User2`, 'INSERT'),
    ]);
    const putEvents = mockedEventBridgePutEvents.mockImplementationOnce(
      () => Promise.resolve({ FailedEntryCount: 1, Entries: [] }),
    );

    await expect(handler(event)).rejects.toThrowError();

    expect(putEvents).toHaveBeenCalledTimes(1);
  });

  // Run parameterised tests to verify that MODIFY and REMOVE operations are ignored
  it.each(['MODIFY', 'REMOVE'])('ignores stream events with EventName="%s"', async (operationToIgnore) => {
    const insertedUserId = `${uuid()}_ddbProcessNewMember_User1`;
    const event = getDynamoDBStreamEvent([
      getTestClubMemberRecord(`${uuid()}_ddbProcessNewMember_IgnoreMe`, operationToIgnore as DynamoDBStreamEventName), // add in event to be ignored
      getTestClubMemberRecord(insertedUserId, 'INSERT'),
    ]);
    const putEvents = mockedEventBridgePutEvents.mockImplementationOnce(
      () => Promise.resolve({ FailedEntryCount: 0, Entries: [] }),
    );

    await handler(event);

    // Verify that only the 1 entry for the INSERT test user was sent to EB
    expect(putEvents).toHaveBeenCalledTimes(1);
    const requestArg = putEvents.mock.calls[0][0] as PutEventsRequest;
    expect(requestArg.Entries).toHaveLength(1);
    const sentEvent = JSON.parse(requestArg.Entries![0].Detail!) as MemberJoinedClubEvent;
    expect(sentEvent.member.user.id).toEqual(insertedUserId);
  });

  it('doesnt call EventBridge if no INSERT events are included in batch', async () => {
    const event = getDynamoDBStreamEvent([
      getTestClubMemberRecord(`${uuid()}_ddbProcessNewMember_IgnoreMe1`, 'MODIFY'),
      getTestClubMemberRecord(`${uuid()}_ddbProcessNewMember_IgnoreMe2`, 'REMOVE'),
    ]);
    const putEvents = mockedEventBridgePutEvents.mockImplementationOnce(
      () => Promise.resolve({ FailedEntryCount: 0, Entries: [] }),
    );

    await handler(event);

    // Verify that EB API wasn't called
    expect(putEvents).toHaveBeenCalledTimes(0);
  });
});
