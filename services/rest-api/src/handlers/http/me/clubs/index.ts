import { listClubsForManager } from '@svc/lib/repos/clubs-repo';
import log from '@dazn/lambda-powertools-logger';
import { APIGatewayProxyEventV2 } from 'aws-lambda';
import { getUserFromClaims } from '@svc/lib/auth/claims-parser';

/**
 * Lambda handler for `GET /me/clubs` endpoint.
 */
export const get = async (event: APIGatewayProxyEventV2) => {
  const currentUser = getUserFromClaims(event.requestContext.authorizer?.jwt.claims!);
  const response = await listClubsForManager(currentUser.id);
  log.debug('Fetched clubs from db.', { response });
  return {
    statusCode: 200,
    body: JSON.stringify(response),
  };
};
