import log from '@dazn/lambda-powertools-logger';
import { getUserFromClaims } from '@svc/lib/auth/claims-parser';
import { publishEvent } from '@svc/lib/events/events-publisher';
import { getClub, putClubMember } from '@svc/lib/repos/clubs-repo';
import { EventDetailType, MemberJoinedClubEvent, MemberRole } from '@svc/lib/types/sports-club-manager';
import { APIGatewayProxyEventV2 } from 'aws-lambda';

/**
 * Lambda handler for `POST /clubs/{clubId}/join` endpoint.
 */
export const post = async (event: APIGatewayProxyEventV2) => {
  log.debug('received event', { event });

  const { clubId } = event.pathParameters!;
  const user = getUserFromClaims(event.requestContext.authorizer?.jwt.claims!);

  const club = await getClub(clubId);
  if (!club) {
    return {
      statusCode: 400,
      body: JSON.stringify({ error: `Invalid clubId: ${clubId}` }),
    };
  }
  // Put the ClubMember to DDB
  await putClubMember(club, user);

  // Now publish event to Eventbridge
  const evt: MemberJoinedClubEvent = {
    member: { user, role: MemberRole.PLAYER, club },
  };
  await publishEvent(evt, EventDetailType.MEMBER_JOINED_CLUB);

  return {
    statusCode: 201,
    body: JSON.stringify(evt),
  };
};
