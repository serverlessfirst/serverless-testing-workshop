import log from '@dazn/lambda-powertools-logger';
import { APIGatewayProxyEvent } from 'aws-lambda';

/**
 * Gets profile of current user.
 */
export const get = async (event: APIGatewayProxyEvent) => {
  log.debug('/me called', { event });
  return {
    statusCode: 200,
    body: JSON.stringify({ event }),
  };
};
