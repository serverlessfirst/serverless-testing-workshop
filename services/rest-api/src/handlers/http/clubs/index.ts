import { listClubsByVisibility } from '@svc/lib/repos/clubs-repo';
import { ClubVisibility } from '@svc/lib/types/sports-club-manager';
import log from '@dazn/lambda-powertools-logger';
import { APIGatewayProxyEventV2 } from 'aws-lambda';

/**
 * Lambda handler for `GET /clubs` endpoint.
 */
export const get = async (event: APIGatewayProxyEventV2) => {
  // Parse options from querystring
  const options = {
    ...(event.queryStringParameters?.limit && {
      limit: parseInt(event.queryStringParameters?.limit, 10),
    }),
    lastEvaluatedKey: event.queryStringParameters?.lastEvaluatedKey,
  };
  // hand-off to repo function
  log.debug('Fetching clubs from db...', { options });
  const response = await listClubsByVisibility(ClubVisibility.PUBLIC, options);
  log.debug('Fetched clubs from db.', { response });
  return {
    statusCode: 200,
    body: JSON.stringify(response),
  };
};
