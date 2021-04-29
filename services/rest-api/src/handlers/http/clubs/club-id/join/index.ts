import log from '@dazn/lambda-powertools-logger';
import { getUserFromClaims } from '@svc/lib/auth/claims-parser';
import { getClub, putClubMember } from '@svc/lib/repos/clubs-repo';
import { ClubMember, MemberRole } from '@svc/lib/types/sports-club-manager';
import { APIGatewayProxyEventV2 } from 'aws-lambda';

/**
 * Lambda handler for `POST /clubs/{clubId}/join` endpoint.
 */
export const post = async (event: APIGatewayProxyEventV2) => {
  log.debug('received event', { event });

  const { clubId } = event.pathParameters!;
  const user = getUserFromClaims(event.requestContext.authorizer?.jwt.claims!);

  const club = await getClub(clubId!);
  if (!club) {
    return {
      statusCode: 400,
      body: JSON.stringify({ error: `Invalid clubId: ${clubId}` }),
    };
  }
  // Put the ClubMember to DDB
  await putClubMember(club, user);

  const member: ClubMember = { user, role: MemberRole.PLAYER, club };

  return {
    statusCode: 201,
    body: JSON.stringify(member),
  };
};
