import log from '@dazn/lambda-powertools-logger';
import { getUserFromClaims } from '@svc/lib/auth/claims-parser';
import { APIGatewayProxyEventV2 } from 'aws-lambda';

/**
 * Gets profile of current user.
 */
export const get = async (event: APIGatewayProxyEventV2) => {
  log.debug('/me called', { event });
  const user = getUserFromClaims(event.requestContext.authorizer?.jwt.claims!);
  return {
    statusCode: 200,
    body: JSON.stringify(user),
  };
};
