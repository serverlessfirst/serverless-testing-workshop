import { DynamoDBStreamEvent } from 'aws-lambda';
import log from '@dazn/lambda-powertools-logger';
import { publishEvents } from '@svc/lib/events/events-publisher';
import { ClubMember, EventDetailType, MemberJoinedClubEvent } from '@svc/lib/types/sports-club-manager';
import { unmarshall } from '@aws-sdk/util-dynamodb';

export const handler = async (event: DynamoDBStreamEvent) => {
  log.debug('Received event', { event });

  // Filter out any non-INSERT events and map DDB item into our domain event structure
  const newMemberEvents: MemberJoinedClubEvent[] = event.Records
    .filter(r => r.eventName === 'INSERT' && r.dynamodb?.NewImage)
    .map((r) => {
      const member: ClubMember = unmarshall(r.dynamodb!.NewImage! as any) as any;
      return { member };
    });

  if (newMemberEvents.length) {
    // Publish events in a single request to EventBridge API
    await publishEvents(newMemberEvents, EventDetailType.MEMBER_JOINED_CLUB);
  }
  log.debug(`Processed ${newMemberEvents.length} new member events.`);
};
