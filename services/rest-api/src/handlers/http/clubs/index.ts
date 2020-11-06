import { listClubsByVisibility } from '@svc/lib/repos/clubs-repo';
import { ClubVisibility } from '@svc/lib/types/sports-club-manager';

/**
 * Lambda handler for `GET /clubs` endpoint.
 */
export const get = async (event: any) => {
  // Parse options from querystring
  const options = {
    ...(event.queryStringParameters?.limit && {
      limit: parseInt(event.queryStringParameters?.limit, 10),
    }),
    lastEvaluatedKey: event.queryStringParameters?.lastEvaluatedKey,
  };
  // hand-off to repo function
  const response = await listClubsByVisibility(ClubVisibility.PUBLIC, options);
  return {
    statusCode: 200,
    body: JSON.stringify(response),
  };
};
